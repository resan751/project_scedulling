import express from 'express'
import AuthRouter from './routes/auth.route.js'

const app = express()
const port = 3000

app.use(express.json())

app.use('/', AuthRouter)

app.listen(port, () => {
  console.log(`server e wes mlaku mas ${port}`)
})
