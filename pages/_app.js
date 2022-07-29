import '../styles/globals.css';
import { DataContext } from '../components/DataContext';
import { useState } from 'react';
import io from 'socket.io-client';

let socket;

export default function MyApp({ Component, pageProps }) {
    const [id, setId] = useState();
    const [auth, setAuth] = useState(false);
    const [name, setName] = useState(null);

    const login = (name) => {
        setName(name);
        setAuth(true);
        socketInitializer();
    }

    const logout = () => {
        setName(null);
        setAuth(false);
        if (socket.connected == true) {
            socket.disconnect();
        }
    }

    const socketInitializer = async () => {
        await fetch('/api/game');
        socket = io('/game');

        socket.on('connect', () => {
            console.log('connected');
            socket.emit('firstConnect', { name: name})
            socket.on('id', id => {
                setId(id);
            })
        });

        socket.on('disconnect', () => {
            console.log('disconnect');
        });
    }

    return (
        <>
            {!auth && (
                <>
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
            {auth && (
                <>
                    <button onClick={() => { logout() }}>ログアウト</button>
                    <DataContext.Provider value={{ socket: socket, id: id }}>
                        <Component {...pageProps} />
                    </DataContext.Provider>
                </>
            )}
        </>
    );
}