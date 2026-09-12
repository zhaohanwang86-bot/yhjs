import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, Input, Textarea, ScrollView } from '@tarojs/components'
import Taro, { useReachBottom } from '@tarojs/taro'
import classnames from 'classnames'
import { apiGet, apiPost } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import type { Post } from '@/types'
import { formatTime } from '@/utils/format'
import styles from './index.module.scss'

const PAGE_SIZE = 10

const CommunityPage: React.FC = () => {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const [tags, setTags] = useState<string[]>([])
  const [activeTag, setActiveTag] = useState('')
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showPublish, setShowPublish] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const loadPosts = useCallback(
    async (reset = false) => {
      const targetPage = reset ? 1 : page
      setLoading(true)
      try {
        const params: Record<string, unknown> = { page: targetPage, pageSize: PAGE_SIZE }
        if (activeTag) {
          params.tag = activeTag
        }
        const res = await apiGet<Post[]>('/posts', params)
        const data = res.data || []
        setPosts((prev) => (reset ? data : [...prev, ...data]))
        setPage(targetPage + 1)
        setTotal(res.pagination?.total || 0)
        // 收集标签
        setTags((prev) => {
          const merged = [...prev]
          data.forEach((p) => {
            if (p.tag && !merged.includes(p.tag)) {
              merged.push(p.tag)
            }
          })
          return merged
        })
      } catch (err) {
        console.error('[Community] loadPosts error:', err)
      } finally {
        setLoading(false)
      }
    },
    [activeTag, page]
  )

  useEffect(() => {
    loadPosts(true)
  }, [activeTag])

  useReachBottom(() => {
    if (!loading && posts.length < total) {
      loadPosts(false)
    }
  })

  const goDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/post/index?id=${id}` })
  }

  const openPublish = () => {
    if (!isLoggedIn()) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    setShowPublish(true)
  }

  const submitPublish = async () => {
    if (!title.trim() || !content.trim()) {
      Taro.showToast({ title: '标题和内容不能为空', icon: 'none' })
      return
    }
    try {
      await apiPost('/posts', { title: title.trim(), content: content.trim(), tag: activeTag || '养生讨论' })
      Taro.showToast({ title: '发布成功', icon: 'success' })
      setShowPublish(false)
      setTitle('')
      setContent('')
      loadPosts(true)
    } catch (err) {
      console.error('[Community] publish error:', err)
    }
  }

  return (
    <View className={styles.page}>
      <ScrollView scrollX className={styles.tabs} enhanced showScrollbar={false}>
        <View
          className={classnames(styles.tab, !activeTag && styles.tabActive)}
          onClick={() => setActiveTag('')}
        >
          <Text className={styles.tabText}>全部</Text>
        </View>
        {tags.map((tag) => (
          <View
            key={tag}
            className={classnames(styles.tab, activeTag === tag && styles.tabActive)}
            onClick={() => setActiveTag(tag)}
          >
            <Text className={styles.tabText}>{tag}</Text>
          </View>
        ))}
      </ScrollView>

      <ScrollView scrollY className={styles.list}>
        {posts.map((post) => (
          <View key={post.id} className={styles.card} onClick={() => goDetail(post.id)}>
            <View className={styles.cardHeader}>
              <View className={styles.avatar}>
                <Text>{post.nickname ? post.nickname.charAt(0) : '炎'}</Text>
              </View>
              <View className={styles.cardUser}>
                <Text className={styles.nickname}>{post.nickname || '匿名用户'}</Text>
                <Text className={styles.time}>{formatTime(post.created_at)}</Text>
              </View>
              <Text className={styles.tagPill}>{post.tag}</Text>
            </View>
            <Text className={styles.postTitle}>{post.title}</Text>
            <Text className={styles.postContent}>{post.content}</Text>
            <View className={styles.cardFooter}>
              <Text className={styles.stat}>👍 {post.like_count}</Text>
              <Text className={styles.stat}>💬 {post.comment_count}</Text>
            </View>
          </View>
        ))}
        {posts.length === 0 && !loading ? (
          <View className={styles.empty}>暂无帖子，快来发布第一篇吧</View>
        ) : (
          <View className={styles.loading}>
            {posts.length >= total ? '— 已经到底啦 —' : '加载中…'}
          </View>
        )}
      </ScrollView>

      <View className={styles.fab} onClick={openPublish}>
        <Text className={styles.fabText}>＋ 发布</Text>
      </View>

      {showPublish && (
        <View className={styles.mask} onClick={() => setShowPublish(false)}>
          <View className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.sheetTitle}>发布帖子</Text>
            <Input
              className={styles.input}
              placeholder='标题'
              value={title}
              onInput={(e) => setTitle(e.detail.value)}
            />
            <Textarea
              className={styles.textarea}
              placeholder='分享你的养生心得…'
              value={content}
              onInput={(e) => setContent(e.detail.value)}
            />
            <View className={styles.publishBtn} onClick={submitPublish}>
              <Text className={styles.publishText}>发布</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default CommunityPage
