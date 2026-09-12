export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/category/index',
    'pages/community/index',
    'pages/mine/index',
    'pages/product/index',
    'pages/store/index',
    'pages/post/index',
    'pages/login/index',
    'pages/orders/index',
    'pages/favorites/index',
    'pages/merchant/index',
    'pages/admin/index',
    'pages/join/index',
    'pages/checkout/index',
    'pages/ai/index',
    'pages/logistics/index'
  ],
  permission: {
    'scope.userLocation': {
      desc: '用于在物流地图中显示你的收货位置'
    }
  },
  requiredPrivateInfos: ['getLocation'],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '炎黄济世',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f7f5f0'
  },
  tabBar: {
    color: '#9e9e9e',
    selectedColor: '#8c1f28',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-selected.png'
      },
      {
        pagePath: 'pages/category/index',
        text: '分类',
        iconPath: 'assets/tabbar/category.png',
        selectedIconPath: 'assets/tabbar/category-selected.png'
      },
      {
        pagePath: 'pages/community/index',
        text: '社区',
        iconPath: 'assets/tabbar/community.png',
        selectedIconPath: 'assets/tabbar/community-selected.png'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'assets/tabbar/mine.png',
        selectedIconPath: 'assets/tabbar/mine-selected.png'
      }
    ]
  }
})
