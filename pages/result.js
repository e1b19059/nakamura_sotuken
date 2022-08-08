import Head from 'next/head';
import { useContext } from 'react';
import { DataContext } from '../components/DataContext';

export default function Result() {
  const context = useContext(DataContext);
  const logout = context.logout;

  return (
    <>
      <Head>
        <title>リザルト</title>
      </Head>
      <button onClick={() => { logout() }}>ログアウト</button>
      <h1>スコア</h1>
    </>
  );
}
