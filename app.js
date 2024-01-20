const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const app = express()
const dbPath = path.join(__dirname, 'userData.db')
app.use(express.json())

// initializing db and connect server...
let db = null
const initializingDBAndConnectServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (err) {
    console.log(`DB ERROR: ${err.message}`)
    process.exit(1)
  }
}
initializingDBAndConnectServer()

//Register User API

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const getUserQuery = `
  SELECT 
  * 
  FROM 
  user 
  WHERE username = "${username}";`
  const dbUser = await db.get(getUserQuery)

  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const createUserQuery = `
      INSERT INTO 
      user(username,name,password,gender,location)
      values ("${username}","${name}","${hashedPassword}","${gender}","${location}");`

      await db.run(createUserQuery)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

// Login User API

app.post('/login', async (request, response) => {
  const {username, password} = request.body

  const getUserQuery = `
  SELECT 
  * 
  FROM 
  user 
  WHERE username = "${username}";`

  const dbUser = await db.get(getUserQuery)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

// Change Password API

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const hashedPassword = await bcrypt.hash(newPassword, 10)
  const getUserQuery = `
  SELECT 
  * 
  FROM 
  user 
  WHERE username = "${username}";`

  const dbUser = await db.get(getUserQuery)
  const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password)

  if (isPasswordMatched === true) {
    if (newPassword.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const updatePasswordQuery = `
      UPDATE user
      SET password = "${hashedPassword}"
      WHERE username = "${username}";`

      await db.run(updatePasswordQuery)
      response.send('Password updated')
    }
  } else {
    response.status(400)
    response.send('Invalid current password')
  }
})

module.exports = app
