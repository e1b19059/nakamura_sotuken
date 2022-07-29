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
                }
                if (empty > 0) {
                    let emptyId = store.findIndex(client => client.socketId == null)
                    store[emptyId] = usrobj;
                    empty--;
                    socket.emit('id', emptyId);
                } else {
                    store[id] = usrobj;
                    socket.emit('id', id++);
                }
            })

            socket.on('disconnect', () => {
                console.log(`disconnect:${socket.id}`);
                let index = store.findIndex(client => client.socketId == socket.id);
                store[index].socketId = null;
                empty++;
            });
        });
        res.socket.server.io = gameNS;
    }
    res.end();
}