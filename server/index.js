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

app.get("/api/rooms/:roomId", (req, res) => {
    const roomId = req.params.roomId
    res.status(200).send(ROOMS.get(roomId))

})

app.get("/api/rooms", (req, res) => {
    res.status(200).send(ROOMS.JSON())
})


app.get('/', (req, res) => {
    res.render('Main', { numberOfClients: CLIENTS});
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


    socket.on('joinRoom', (data)=>{
        var d = ROOMS.get(data.hostID)
        ROOMS.set(data.hostID, {
            ...d,
            clientID: data.clientID,
            clientName: data.clientName,
            status: data.status
        })

        RoomNewUpdate(socket)

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
                hostName: data.name,
                status: 'waiting'
            })
            console.log(ROOMS.JSON())
            RoomNewUpdate(socket)
        }else{
            console.log('room already created ee')
        }
 
    })
}

const RoomNewUpdate = (socket) =>{
    socket.broadcast.emit("showRoom", {...ROOMS.JSON()})
}