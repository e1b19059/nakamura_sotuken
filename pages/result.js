import Head from 'next/head';
import { useRouter } from 'next/router';
import { useContext } from 'react';
import { DataContext } from '../components/DataContext';

export default function Result() {
    const router = useRouter();
    const context = useContext(DataContext);
    const logout = context.logout;

    return (
        <>
            <Head>
                <title>リザルト</title>
            </Head>
            <button onClick={() => { logout() }}>ログアウト</button>
            <h1>スコア</h1>
            <h2>{router.query.turn}ターン目</h2>
            {router.query.result == 0 ? <h2>引き分け</h2> : null}
            {router.query.result == 1 ? <h2>チーム1の勝ち</h2> : null}
            {router.query.result == 2 ? <h2>チーム2の勝ち</h2> : null}
            <h2>チーム1のミス:{router.query.miss1}回</h2>
            <h2>チーム2のミス:{router.query.miss2}回</h2>
        </>
    );
}
