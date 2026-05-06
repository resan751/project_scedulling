import express from 'express'
import AuthRouter from './routes/auth.route.js'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()
const port = 3000
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', AuthRouter)

app.listen(port, () => {
  console.log(`server e wes mlaku mas ${port}`)
})
