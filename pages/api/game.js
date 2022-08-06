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
                    role: null
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
                        store[msg.id].role = null;
                    }
                    store[msg.id].room = msg.room;
                    socket.emit('clients-and-room', { clients: store, room: msg.room });
                    socket.broadcast.emit('all-clients', { clients: store });
                }
            });

            socket.on('roleHandler', msg => {
                let roomMember = store.filter(client => client.room == store[msg.id].room);
                store[msg.id].role = msg.role;
                
                socket.emit('clients-and-role', { clients: store, room: msg.room });
                socket.broadcast.emit('all-clients', { clients: store });

                if (roomMember.find(client => client.role == "d1")
                    && roomMember.find(client => client.role == "n1")
                    && roomMember.find(client => client.role == "d2")
                    && roomMember.find(client => client.role == "n2")) {
                    console.log('Role Conpletes');
                    gameNS.to(store[msg.id].room).emit('router-push', roomMember);
                }
            });

            socket.on('am-i-first', role => {
                if (role == "d1" || role == "n1") {
                    socket.emit('you-are-first', true);
                } else {
                    socket.emit('you-are-first', false);
                }
            })

            socket.on('pass-turn', msg => {
                let room = store[msg.id].room;
                socket.broadcast.to(room).emit('pass-turn');
            })

            //msg={id}
            socket.on('pass-run', msg=>{
                let room = store[msg.id].room;
                socket.broadcast.to(room).emit('pass-run');
                console.log('pass-run受信')
            })

            // ワークスペースの共有、msg={block,id,role}
            socket.on('blocks', msg => {
                let roomMember = store.filter(client => client.room == store[msg.id].room)
                for (let i = 0; i < roomMember.length; i++) {
                    if (roomMember[i].role == "n1") {
                        if (msg.role == "d1") {
                            gameNS.to(roomMember[i].socketId).emit('friend-block', msg.block);
                        } else {
                            gameNS.to(roomMember[i].socketId).emit('enemy-block', msg.block);
                        }
                    } else if (roomMember[i].role == "n2") {
                        if (msg.role == "d2") {
                            gameNS.to(roomMember[i].socketId).emit('friend-block', msg.block);
                        } else {
                            gameNS.to(roomMember[i].socketId).emit('enemy-block', msg.block);
                        }
                    }else if (roomMember[i].role == "d1" && msg.role == "d2" 
                            || roomMember[i].role == "d2" && msg.role == "d1") {
                        gameNS.to(roomMember[i].socketId).emit('enemy-block', msg.block);
                    }
                }
            })

            socket.on('pass-block-run', msg =>{
                let roomMember = store.filter(client => client.room == store[msg.id].room)
                for (let i = 0; i < roomMember.length; i++) {
                    if (roomMember[i].role == "n1") {
                        if (msg.role == "d1") {
                            gameNS.to(roomMember[i].socketId).emit('friend-block-run', msg.block);
                        } else {
                            gameNS.to(roomMember[i].socketId).emit('enemy-block-run', msg.block);
                        }
                    } else if (roomMember[i].role == "n2") {
                        if (msg.role == "d2") {
                            gameNS.to(roomMember[i].socketId).emit('friend-block-run', msg.block);
                        } else {
                            gameNS.to(roomMember[i].socketId).emit('enemy-block-run', msg.block);
                        }
                    }else if (roomMember[i].role == "d1" && msg.role == "d2" 
                            || roomMember[i].role == "d2" && msg.role == "d1") {
                        gameNS.to(roomMember[i].socketId).emit('enemy-block-run', msg.block);
                    }
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