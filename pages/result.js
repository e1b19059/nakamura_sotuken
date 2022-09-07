import Head from 'next/head';
import { useRouter } from 'next/router';
import { useContext } from 'react';
import { DataContext } from '../components/DataContext';

export default function Result() {
    const router = useRouter();
    const context = useContext(DataContext);
    const roomMember = context.roomMember;
    const logout = context.logout;

    return (
        <>
            <Head>
                <title>リザルト</title>
            </Head>
            <button onClick={() => { logout() }}>ログアウト</button>
            <h1>スコア</h1>
            <h2>{router.query.turn}ターン目：
                {router.query.result == 0 ? '引き分け' : null}
                {router.query.result == 1 ? 'チーム1の勝ち' : null}
                {router.query.result == 2 ? 'チーム2の勝ち' : null}
            </h2>
            <h3>チーム1</h3>
            ドライバー：{roomMember.find(member => member.role == 'd1').name}<br />
            ナビゲーター：{roomMember.find(member => member.role == 'n1').name}<br />
            チーム1のミス:{router.query.miss1}回
            <h3>チーム2</h3>
            ドライバー：{roomMember.find(member => member.role == 'd2').name}<br />
            ナビゲーター：{roomMember.find(member => member.role == 'n2').name}<br />
            チーム2のミス:{router.query.miss2}回
        </>
    );
}
