require('dotenv').config()
const express = require('express')
const headerParser = require('header-parser')
const bodyParser = require('body-parser')
const formData = require('express-form-data')
const os = require('os')
const startStatusLoop = require('./status-loop/queryValidators')

const signatureCheck = require('./helpers/signatureCheck')
const campaignsRoutes = require('./routes/campaigns')
const statsRoutes = require('./routes/stats')
const usersRoutes = require('./routes/users')
const validatorsRoutes = require('./routes/validators')
const adSlotsRoutes = require('./routes/adSlots')
const adUnitsRoutes = require('./routes/adUnits')
const mediaRoutes = require('./routes/media')
const authRoutes = require('./routes/auth')

const seedDb = require('./test/prep-db/seedDb').seedDb

const app = express()
const db = require('./db')
const port = process.env.PORT || 3012

const options = {
	uploadDir: os.tmpdir(),
	autoClean: true
}

app.use(formData.parse(options))
app.use(formData.format())
app.use(formData.stream())
app.use(formData.union())
app.use(headerParser)
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*')
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-User-Signature, X-User-Address, X-Auth-Token')
	res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS')
	next()
})

app.use('/campaigns', campaignsRoutes)
app.use('/stats', statsRoutes)
app.use('/users', usersRoutes)
app.use('/validators', validatorsRoutes)
app.use('/auth', authRoutes)
app.use('/adslots', signatureCheck, adSlotsRoutes)
app.use('/adunits', signatureCheck, adUnitsRoutes)
app.use('/media', signatureCheck, mediaRoutes)

db.connect()
	.then(() => {
		if (process.env.NODE_ENV === 'test') {
			console.log('Seeding DB for tests', process.env.DB_MONGO_NAME)
			return seedDb(db.getMongo())
		} else {
			return Promise.resolve()
		}
	})
	.then((res) => {
		startStatusLoop()
	})
	.then(() => {
		app.listen(port, () => console.log(`Magic happens on ${port}`))
	})
	.catch((err) => {
		console.error('Error when starting app', err)
		throw new Error(err)
	})
