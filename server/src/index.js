import app from './app.js'
import { env } from './config/index.js'

const port = env.PORT

app.listen(port, () => {
	console.log(`Open Facture API listening on http://localhost:${port}`)
})
