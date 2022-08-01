import { Server } from 'socket.io';

let store = [];
let id = 0;
let empty = 0;

export default function socketHandler(req, res) {
    if (!res.socket.server.io) {
        const io = new Server(res.socket.server);
        const gameNS = io.of('/game');

        gameNS.on('connection', socket => {

            socket.on('firstConnect', msg => {
                let usrobj = {
                    name: msg.name,
                    socketId: socket.id,
                    room: null,
                }
                if (empty > 0) {
                    let emptyId = store.findIndex(client => client.socketId == null)
                    store[emptyId] = usrobj;
                    empty--;
                    socket.emit('id', { id: emptyId, clients: store });
                } else {
                    store[id] = usrobj;
                    socket.emit('id', { id: id++, clients: store });
                }
            })

            socket.on('roomHandler', msg => {
                if (store.filter(client => client.room == msg.room).length >= 4) {
                    socket.emit('roomError', `${msg.room}は満員です`);
                } else {
                    let oldRoom = null;
                    if (socket.rooms.size == 1) {
                        if (msg.room != null) socket.join(msg.room);
                    } else {
                        socket.leave(store[msg.id].room);
                        if (msg.room != null) socket.join(msg.room);
                        oldRoom = store[msg.id].room;
                    }
                    store[msg.id].room = msg.room;
                    socket.emit('clients-and-room', { clients: store, room: msg.room });
                    socket.broadcast.emit('all-clients', { clients: store });
                }
            });

            socket.on('disconnect', () => {
                console.log(`disconnect:${socket.id}`);
                let index = store.findIndex(client => client.socketId == socket.id);
                store[index].socketId = null;
                store[index].room = null;
                empty++;
                socket.broadcast.emit('all-clients', { clients: store });
            });
        });
        res.socket.server.io = gameNS;
    }
    res.end();
}