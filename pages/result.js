import Head from 'next/head';
import Link from 'next/link';

export default function Result() {
  return (
    <>
      <Head>
        <title>リザルト</title>
      </Head>
      <Link href="/">
        <a>ホームへ</a>
      </Link>
      <h1>スコア</h1>
    </>
  );
}
