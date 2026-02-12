import { useState } from 'react'
import { View, Text, Input, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { childrenApi } from '../../api/children'
import './index.scss'

export default function AddChildPage() {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  const handleSubmit = async () => {
    if (\!name.trim()) {
      Taro.showToast({ title: '请输入孩子姓名', icon: 'none' })
      return
    }
    if (\!birthDate) {
      Taro.showToast({ title: '请选择出生日期', icon: 'none' })
      return
    }

    setSubmitting(true)
    try {
      const res = await childrenApi.create({
        name: name.trim(),
        birthDate,
        gender,
      })
      if (res.success) {
        Taro.showToast({ title: '添加成功', icon: 'success' })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({ title: res.error || '添加失败', icon: 'none' })
      }
    } catch (error) {
      console.error('Failed to create child:', error)
      Taro.showToast({ title: '网络错误，请重试', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDisplayDate = (dateStr: string) => {
    if (\!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    return `${y}年${m}月${d}日`
  }

  return (
    <View className='add-child-page'>
      <View className='form-card'>
        {/* Name */}
        <View className='form-group'>
          <Text className='form-label'>孩子姓名</Text>
          <Input
            className='form-input'
            placeholder='请输入孩子姓名'
            placeholderClass='form-placeholder'
            value={name}
            onInput={(e) => setName(e.detail.value)}
            maxlength={20}
          />
        </View>

        {/* Birth date */}
        <View className='form-group'>
          <Text className='form-label'>出生日期</Text>
          <Picker
            mode='date'
            value={birthDate}
            start='2010-01-01'
            end={today}
            onChange={(e) => setBirthDate(e.detail.value)}
          >
            <View className='form-picker'>
              <Text className={birthDate ? 'picker-value' : 'picker-placeholder'}>
                {birthDate ? formatDisplayDate(birthDate) : '请选择出生日期'}
              </Text>
              <Text className='picker-arrow'>{'>'}</Text>
            </View>
          </Picker>
        </View>

        {/* Gender */}
        <View className='form-group'>
          <Text className='form-label'>性别</Text>
          <View className='gender-selector'>
            <View
              className={'gender-option' + (gender === 'male' ? ' active' : '')}
              onClick={() => setGender('male')}
            >
              <Text className='gender-emoji'>👦</Text>
              <Text className={'gender-text' + (gender === 'male' ? ' active' : '')}>男孩</Text>
            </View>
            <View
              className={'gender-option' + (gender === 'female' ? ' active' : '')}
              onClick={() => setGender('female')}
            >
              <Text className='gender-emoji'>👧</Text>
              <Text className={'gender-text' + (gender === 'female' ? ' active' : '')}>女孩</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Submit button */}
      <View
        className={'submit-btn' + (submitting ? ' disabled' : '')}
        onClick={submitting ? undefined : handleSubmit}
      >
        <Text className='submit-btn-text'>
          {submitting ? '添加中...' : '添加孩子'}
        </Text>
      </View>
    </View>
  )
}
