import '../styles/globals.css';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { DataContext } from '../components/DataContext';
import { useState } from 'react';
import io from 'socket.io-client';

let socket;

export default function MyApp({ Component, pageProps }) {
    const router = useRouter();
    const [id, setId] = useState();
    const [name, setName] = useState(null);
    const [auth, setAuth] = useState(false);
    const [session, setSession] = useState(false);
    const [members, setMembers] = useState([]);
    const [room, setRoom] = useState(null);
    const [role, setRole] = useState(null);

    const login = (name) => {
        setName(name);
        setAuth(true);
        socketInitializer(name);
    }

    const logout = () => {
        setName(null);
        setAuth(false);
        setSession(false);
        setRoom(null);
        if (socket.connected == true) {
            socket.off('disconnect');
            socket.disconnect();
        }
        router.push('/');
    }

    const socketInitializer = async (name) => {
        await fetch('/api/game');
        socket = io('/game');

        socket.on('connect', () => {
            console.log('connected');
            socket.emit('firstConnect', { name: name })
            socket.on('id', msg => {
                setId(msg.id);
                setMembers(msg.clients);
            })
        });

        socket.on('all-clients', msg => {
            setMembers(msg.clients);
        })

        socket.on('clients-and-room', msg => {
            setRoom(msg.room);
            setMembers(msg.clients);
        });

        socket.on('clients-and-role', msg => {
            setRole(msg.role);
            setMembers(msg.clients);
        });

        socket.on('router-push', roomMember => {
            let role = roomMember.find(member => member.socketId == socket.id).role;
            setRole(role);
            setSession(true);
            router.push('game');
            socket.off('all-clients');
            socket.off('clients-and-room');
            socket.off('clients-and-role');
        })

        socket.on('disconnect', () => {
            console.log('disconnect');
            alert('通信が切断されました。');
            logout();
        });
    }

    const roomHandler = (room) => {
        socket.emit('roomHandler', { id: id, room: room });
    }

    const roleHandler = (role) => {
        socket.emit('roleHandler', { id: id, role: role });
    }

    const roomRender = (props) => {
        let key = 0;
        return (
            <>
                <form>
                    <input type="radio" name="room" value="none" id="none"
                        onChange={() => { roomHandler(null) }} defaultChecked={true}
                    /><label htmlFor="none">なし</label>
                    <input type="radio" name="room" value="room1" id="room1"
                        onChange={() => { roomHandler(1) }}
                    /><label htmlFor="room1">room1({members.filter(client => client.room == 1).length}/4)</label>
                    <input type="radio" name="room" value="room2" id="room2"
                        onChange={() => { roomHandler(2) }}
                    /><label htmlFor="room2">room2({members.filter(client => client.room == 2).length}/4)</label>
                    <input type="radio" name="room" value="room3" id="room3"
                        onChange={() => { roomHandler(3) }}
                    /><label htmlFor="room3">room3({members.filter(client => client.room == 3).length}/4)</label>
                </form>
                {room && (
                    <>
                        <h3>メンバー</h3>
                        {members.filter(client => client.room == props).map(member => {
                            return <li key={key++}>{member.name}({member.role})</li>
                        })}
                        {roleRender()}
                    </>
                )}
            </>
        )
    }

    const roleRender = () => {
        return (
            <>
                <h3>チームと役割</h3>
                <button type="button" name="role" value="driver1" id="driver1"
                    onClick={() => { roleHandler("d1") }}
                >チーム1ドライバー</button>
                <button type="button" name="role" value="navigator1" id="navigator1"
                    onClick={() => { roleHandler("n1") }}
                >チーム1ナビゲーター</button><br />
                <button type="button" name="role" value="driver2" id="driver2"
                    onClick={() => { roleHandler("d2") }}
                >チーム2ドライバー</button>
                <button type="button" name="role" value="navigator2" id="navigator2"
                    onClick={() => { roleHandler("n2") }}
                >チーム2ナビゲーター</button>
            </>
        )
    }

    return (
        <>
            {!auth && (
                <>
                    <Head><title>ホーム</title></Head>
                    <h1>名前を入力してください</h1>
                    <input name="name" onKeyPress={e => {
                        const name = e.target.value;
                        if (e.key !== 'Enter' || !name) {
                            return;
                        }
                        e.target.value = '';
                        login(name);
                    }} />
                </>
            )}
            {auth && !session && (
                <>
                    <Head><title>ホーム</title></Head>
                    <h1>あなたの名前は {name} です</h1>
                    <button onClick={() => { logout() }}>ログアウト</button>
                    {roomRender(room)}
                </>
            )}
            {auth && session && (
                <>
                    <DataContext.Provider value={{ socket: socket, id: id, role: role, roomMember: members.filter(member => member.room == room), logout: () => { logout() } }}>
                        <Component {...pageProps} />
                    </DataContext.Provider>
                </>
            )}
        </>
    );
}