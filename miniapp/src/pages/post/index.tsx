import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { apiGet, apiPost } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import type { Comment, Post } from '@/types'
import { formatTime } from '@/utils/format'
import styles from './index.module.scss'

const PostPage: React.FC = () => {
  const router = useRouter()
  const id = Number(router.params.id || 0)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentText, setCommentText] = useState('')

  const loadPost = useCallback(async () => {
    if (!id) {
      return
    }
    try {
      const [postRes, commentRes] = await Promise.all([
        apiGet<Post>(`/posts/${id}`),
        apiGet<Comment[]>(`/posts/${id}/comments`)
      ])
      setPost(postRes.data)
      setComments(commentRes.data || [])
    } catch (err) {
      console.error('[Post] loadPost error:', err)
      Taro.showToast({ title: '帖子不存在', icon: 'none' })
    }
  }, [id])

  useEffect(() => {
    loadPost()
  }, [loadPost])

  // 帖子详情接口未提供单个帖子查询时，从列表兜底（此处直接请求，无则忽略）
  // 点赞 / 取消点赞
  const toggleLike = async () => {
    if (!isLoggedIn()) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    try {
      const res = await apiPost<{ liked: boolean }>(`/posts/${id}/like`)
      const nowLiked = res.data.liked
      setLiked(nowLiked)
      setLikeCount((prev) => (nowLiked ? prev + 1 : Math.max(prev - 1, 0)))
    } catch (err) {
      console.error('[Post] toggleLike error:', err)
    }
  }

  const submitComment = async () => {
    if (!commentText.trim()) {
      return
    }
    if (!isLoggedIn()) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    try {
      await apiPost(`/posts/${id}/comments`, { content: commentText.trim() })
      setCommentText('')
      Taro.showToast({ title: '评论成功', icon: 'success' })
      loadPost()
    } catch (err) {
      console.error('[Post] submitComment error:', err)
    }
  }

  if (!post) {
    return <View className={styles.loading}>加载中…</View>
  }

  return (
    <View className={styles.page}>
      <View className={styles.card}>
        <Text className={styles.tag}>{post.tag}</Text>
        <Text className={styles.title}>{post.title}</Text>
        <View className={styles.authorRow}>
          <View className={styles.avatar}>
            <Text>{post.nickname ? post.nickname.charAt(0) : '炎'}</Text>
          </View>
          <View className={styles.authorInfo}>
            <Text className={styles.nickname}>{post.nickname || '匿名用户'}</Text>
            <Text className={styles.time}>{formatTime(post.created_at)}</Text>
          </View>
        </View>
        <Text className={styles.content}>{post.content}</Text>
        <View className={styles.likeRow}>
          <View
            className={styles.likeBtn}
            onClick={toggleLike}
          >
            <Text className={styles.likeText}>{liked ? '❤️' : '🤍'} 点赞 {likeCount || post.like_count}</Text>
          </View>
        </View>
      </View>

      <View className={styles.card}>
        <Text className={styles.sectionTitle}>评论（{comments.length}）</Text>
        {comments.length === 0 ? (
          <Text className={styles.empty}>暂无评论，快来抢沙发</Text>
        ) : (
          comments.map((comment) => (
            <View key={comment.id} className={styles.commentItem}>
              <View className={styles.commentHeader}>
                <Text className={styles.commentUser}>{comment.nickname}</Text>
                <Text className={styles.commentTime}>{formatTime(comment.created_at)}</Text>
              </View>
              <Text className={styles.commentContent}>{comment.content}</Text>
            </View>
          ))
        )}
      </View>

      <View className={styles.footer}>
        <Input
          className={styles.commentInput}
          placeholder='写下你的评论…'
          value={commentText}
          onInput={(e) => setCommentText(e.detail.value)}
          onConfirm={submitComment}
        />
        <View className={styles.submitBtn} onClick={submitComment}>
          <Text className={styles.submitText}>发送</Text>
        </View>
      </View>
    </View>
  )
}

export default PostPage
