export default function ApiHomePage() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1>成长时间胶囊 API Server</h1>
      <p style={{ color: '#666' }}>此服务为小程序提供后端 API 接口。</p>
      <h2 style={{ marginTop: '2rem' }}>可用的 API 端点</h2>
      <ul style={{ lineHeight: '2' }}>
        <li><code>GET /api/children</code> — 获取孩子列表</li>
        <li><code>POST /api/children</code> — 创建孩子</li>
        <li><code>GET /api/children/:id</code> — 获取孩子详情</li>
        <li><code>POST /api/children/:id/avatar</code> — 上传头像</li>
        <li><code>GET /api/children/:id/records</code> — 获取记录列表</li>
        <li><code>POST /api/children/:id/records</code> — 创建记录（含自动分析）</li>
        <li><code>POST /api/children/:id/record-with-image</code> — 图文记录</li>
        <li><code>PUT /api/records/:id</code> — 更新记录</li>
        <li><code>DELETE /api/records/:id</code> — 删除记录</li>
        <li><code>POST /api/records/:id/favorite</code> — 收藏/取消收藏</li>
        <li><code>POST /api/analyze</code> — 独立分析接口</li>
        <li><code>POST /api/upload/image</code> — 上传图片</li>
        <li><code>POST /api/auth/wechat-login</code> — 微信登录（待实现）</li>
      </ul>
    </div>
  )
}
