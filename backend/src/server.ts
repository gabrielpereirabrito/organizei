import { app } from './app'
import { env } from './env'

app.listen({
  host: '0.0.0.0', // Fundamental para rodar depois na Render ou em containers
  port: env.PORT,
}).then(() => {
  console.log(`🚀 HTTP Server Running on http://localhost:${env.PORT}`)
})
