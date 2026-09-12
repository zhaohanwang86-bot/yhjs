package com.yhjs.server.order;

import com.yhjs.server.api.AppException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * 库存扣减服务：同一份下单业务代码可切换三种扣减策略，用于超卖治理对比实验。
 *
 * <p>NONE 无防护 —— 先查库存、应用层判断、再回写「计算后的值」。并发下多个事务读到同一份库存，
 * 各自算出相同结果并互相覆盖（丢失更新），订单数超出真实库存，即超卖。仅用于演示「优化前」。
 *
 * <p>PESSIMISTIC 悲观锁 —— SELECT ... FOR UPDATE 先锁住商品行再扣减，后到的事务排队等待，
 * 库存判断一定基于最新值，绝不超卖；代价是热点商品上请求串行等待，P99 随并发上升。
 *
 * <p>OPTIMISTIC 乐观锁 —— 不加锁读取，用 UPDATE ... WHERE stock >= ? 做 CAS 原子扣减，
 * 靠影响行数判断成败，冲突时不等待直接失败；吞吐更高，但高并发下失败率上升。
 */
@Service
public class StockService {

    public enum Strategy {
        NONE,
        PESSIMISTIC,
        OPTIMISTIC
    }

    /** 下单请求中的一行商品 */
    public record ProductLine(Long productId, int quantity) {
    }

    /** 扣减成功后的商品快照，供订单落库与算价使用 */
    public record StockLine(Long productId, String name, BigDecimal price, int quantity, BigDecimal subtotal) {
    }

    private final JdbcTemplate jdbcTemplate;
    private final Strategy strategy;

    public StockService(JdbcTemplate jdbcTemplate, @Value("${stock.strategy:pessimistic}") String strategy) {
        this.jdbcTemplate = jdbcTemplate;
        this.strategy = parseStrategy(strategy);
    }

    public Strategy strategy() {
        return strategy;
    }

    /** 扣减库存并返回商品明细，必须在事务中调用 */
    public List<StockLine> deduct(Long storeId, List<ProductLine> lines) {
        // 统一按商品 ID 升序处理：多商品订单的加锁顺序一致，避免交叉等待造成死锁
        List<ProductLine> sorted = lines.stream()
            .sorted(Comparator.comparing(ProductLine::productId))
            .toList();
        List<StockLine> deducted = new ArrayList<>(sorted.size());
        for (ProductLine line : sorted) {
            if (line.productId() == null || line.quantity() < 1) {
                throw new AppException(400, "商品数量不合法");
            }
            deducted.add(switch (strategy) {
                case PESSIMISTIC -> deductWithRowLock(storeId, line);
                case OPTIMISTIC -> deductWithCas(storeId, line);
                case NONE -> deductWithoutGuard(storeId, line);
            });
        }
        return deducted;
    }

    private StockLine deductWithRowLock(Long storeId, ProductLine line) {
        Map<String, Object> product = requireOnSaleProduct(storeId, line.productId(), true);
        requireEnoughStock(product, line.quantity());
        jdbcTemplate.update(
            "UPDATE products SET stock = stock - ?, sales_count = sales_count + ? WHERE id = ?",
            line.quantity(), line.quantity(), line.productId());
        return toStockLine(product, line.quantity());
    }

    private StockLine deductWithCas(Long storeId, ProductLine line) {
        Map<String, Object> product = requireOnSaleProduct(storeId, line.productId(), false);
        requireEnoughStock(product, line.quantity());
        int affected = jdbcTemplate.update(
            "UPDATE products SET stock = stock - ?, sales_count = sales_count + ? WHERE id = ? AND stock >= ?",
            line.quantity(), line.quantity(), line.productId(), line.quantity());
        if (affected == 0) {
            // 读到的是旧值，扣减瞬间被其他事务抢走：CAS 失败直接拒绝，库存不会被扣成负数
            throw new AppException(400, product.get("name") + "库存不足");
        }
        return toStockLine(product, line.quantity());
    }

    private StockLine deductWithoutGuard(Long storeId, ProductLine line) {
        Map<String, Object> product = requireOnSaleProduct(storeId, line.productId(), false);
        requireEnoughStock(product, line.quantity());
        int stock = ((Number) product.get("stock")).intValue();
        // 无防护：把「读到的库存 - 购买数量」这个计算结果直接写回。
        // 并发事务各自基于同一份旧读数计算并互相覆盖，库存只减了一次，订单却有多笔 —— 超卖
        jdbcTemplate.update(
            "UPDATE products SET stock = ?, sales_count = sales_count + ? WHERE id = ?",
            stock - line.quantity(), line.quantity(), line.productId());
        return toStockLine(product, line.quantity());
    }

    private Map<String, Object> requireOnSaleProduct(Long storeId, Long productId, boolean forUpdate) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
            "SELECT id, store_id, name, price, stock FROM products WHERE id = ? AND status = 'on_sale'"
                + (forUpdate ? " FOR UPDATE" : ""),
            productId);
        if (rows.isEmpty()) {
            throw new AppException(400, "商品不存在或已下架");
        }
        Map<String, Object> product = rows.get(0);
        if (!String.valueOf(product.get("store_id")).equals(String.valueOf(storeId))) {
            throw new AppException(400, "订单商品不属于当前店铺");
        }
        return product;
    }

    private void requireEnoughStock(Map<String, Object> product, int quantity) {
        if (((Number) product.get("stock")).intValue() < quantity) {
            throw new AppException(400, product.get("name") + "库存不足");
        }
    }

    private StockLine toStockLine(Map<String, Object> product, int quantity) {
        BigDecimal price = toDecimal(product.get("price"));
        return new StockLine(
            ((Number) product.get("id")).longValue(),
            (String) product.get("name"),
            price,
            quantity,
            price.multiply(BigDecimal.valueOf(quantity)));
    }

    private static Strategy parseStrategy(String value) {
        if (value == null) {
            return Strategy.PESSIMISTIC;
        }
        return switch (value.trim().toLowerCase()) {
            case "none" -> Strategy.NONE;
            case "optimistic" -> Strategy.OPTIMISTIC;
            default -> Strategy.PESSIMISTIC;
        };
    }

    private static BigDecimal toDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal decimal) {
            return decimal;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }
}
