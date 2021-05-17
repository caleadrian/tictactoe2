// const express = require('express')
// const app = express()

// const server = require('http').createServer(app)
// const io = require('socket.io')(server, 
//     { cors: { 
//         origin: "http://localhost:3000",
//         methods: ["GET", "POST"],methods: ["GET", "POST"],
//         transports: ['websocket', 'polling'],
//         credentials: true
//     },  allowEIO3: true
// })


import express from 'express'
import { Server } from 'socket.io'
import { createServer } from "http"
import path from 'path'
import cors from 'cors'
import JSONdb from 'simple-json-db'
import { Socket } from 'dgram'

const app = express()
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },  allowEIO3: true
})

const __dirname = path.resolve()
const CLIENTS = new JSONdb(__dirname, 'server/resources/clients.json')
const ROOMS =  new JSONdb(__dirname, 'server/resources/rooms.json')

app.use(cors())
app.set('views', path.join(__dirname, 'server/views'))
app.set('view engine', 'ejs')


const PORT = process.env.PORT || 3001
// var CLIENTS = {}
// var ROOMS = {}

app.get("/api/players", (req, res) => {
    res.status(200).send(CLIENTS.JSON())
})

app.get("/api/rooms", (req, res) => {
    res.status(200).send(ROOMS.JSON())
})




app.get('/', (req, res) => {
    res.render('Main', { numberOfClients: Object.keys(CLIENTS).length});
});

server.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`)
});

// function removeItemFromArr(arr, value) { 
//     arr.filter(function(ele){ 
//         return ele != value; 
//     });
// }

//io connection
io.on('connection', (socket) => {

    // REGISTER NEW PLAYER
    socket.on('setPlayerName', data =>{
        CLIENTS.set(socket.id, {
            userId: data.id,
            name: data.name
        })

        //BROADCAST NUMBER OF CLIENTS
        socketPlayerCount(io)
    })




    //DISCONNECT PLYAER
    socket.on('disconnect', ()=>{
        console.log(socket.id, " disconnected")
        // delete CLIENTS[socket.id]

        CLIENTS.delete(socket.id)

        //BROADCAST NUMBER OF CLIENTS
        socketPlayerCount(io)
    })

    socketCreateRoom(socket)

})

const socketPlayerCount = (io) => {
    io.emit("playerCount", {count:  Object.keys(CLIENTS.JSON()).length})
}

const socketCreateRoom = (socket) => {
    socket.on("createRoom", (data) =>{
        if(!ROOMS.has(socket.id)){
            ROOMS.set(socket.id, {
                hostName: data.name
            })
            console.log(ROOMS.JSON())
           socket.broadcast.emit("showRoom", {...ROOMS.JSON()})
        }else{
            console.log('room already created ee')
        }
 
    })
}