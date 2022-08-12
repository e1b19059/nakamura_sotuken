import Head from 'next/head';
import Image from 'next/image'
import { useRouter } from 'next/router';

import { useEffect, useRef, useContext, useState } from 'react';
import { DataContext } from '../components/DataContext';

import BlocklyComponent, { Block, Value, Field, Shadow } from '../components/Blockly';
import BlocklyJS from 'blockly/javascript';

import '../components/blocks/customblocks';
import '../components/generator/generator';
import styles from '/styles/Game.module.css';

import Interpreter from 'js-interpreter';

let intervalId;

// fieldの大きさ
const fieldHeight = 10;
const fieldWidth = 10;
// player1,2の初期位置
const defaultX1 = 1;
const defaultY1 = 1;
const defaultX2 = 9;
const defaultY2 = 1;

export default function Game() {
    const router = useRouter();
    const context = useContext(DataContext);
    const socket = context.socket;
    const id = context.id;
    const role = context.role;

    const friendRef = useRef(null);
    const enemyRef = useRef(null);

    const [field, setField] = useState([]);
    const [player1, setPlayer1] = useState({ x: defaultX1, y: defaultY1 });
    const [player2, setPlayer2] = useState({ x: defaultX2, y: defaultY2 });
    const [miss, setMiss] = useState(0);
    const [first, setFirst] = useState(false);
    const [turn, setTurn] = useState(false);
    const [driver, setDriver] = useState(() => role == "d1" || role == "d2" ? true : false);
    const [navigator, setNavigator] = useState(() => role == "n1" || role == "n2" ? true : false);

    useEffect(() => {
        let array = [];
        for (let i = 0; i < fieldHeight; i++) {
            array[i] = [];
            for (let j = 0; j < fieldWidth; j++) {
                array[i][j] = {
                    key: '(' + i + ',' + j + ')',
                    value: 0
                }
            }
        }
        array[defaultX1][defaultY1].value = 1;
        array[defaultX2][defaultY2].value = 2;
        setField(array);
    }, []);

    useEffect(() => {
        socket.emit('am-i-first', role);
        return () => {
            socket.off('am-i-first');
        }
    }, [role, socket])

    useEffect(() => {
        socketInitializer();
        return () => {
            socket.off('you-are-first');
            socket.off('friend-block');
            socket.off('enemy-block');
            socket.off('friend-block-run');
            socket.off('enemy-block-run');
            socket.off('result-router');
        }
    });

    const socketInitializer = () => {
        socket.on('you-are-first', first => {
            setFirst(first);
            setTurn(first);
        })

        socket.on('friend-block', blockXml => {
            friendRef.current.workspace.clear();
            friendRef.current.setXml(blockXml);
            console.log('friend-updated');
        })

        socket.on('enemy-block', blockXml => {
            enemyRef.current.workspace.clear();
            enemyRef.current.setXml(blockXml);
            console.log('enemy-updated');
        })

        socket.on('friend-block-run', blockXml => {
            setTurn(prevTurn => {
                friendRef.current.workspace.clear();
                friendRef.current.setXml(blockXml);
                stepRun();
                console.log('friend-updated+run');
                return !prevTurn;
            });
        })

        socket.on('enemy-block-run', blockXml => {
            let workspace = friendRef.current.getDomText();
            setTurn(prevTurn => {
                enemyRef.current.workspace.clear();
                enemyRef.current.setXml(blockXml);
                stepRun();
                console.log('enemy-updated+run');
                return !prevTurn;
            });
            setTimeout(() => { friendRef.current.setXml(workspace); }, 1000);
        })

        socket.on('result-router', () => {
            router.push('result');
        })
    }

    const exBlock = () => {
        console.log('送信')
        socket.emit('blocks', { block: friendRef.current.getDomText(), id: id, role: role })
    }

    function startEmit() {
        intervalId = setInterval(() => {
            exBlock();
        }, 1000);
        console.log('開始');
    }

    function stopEmit() {
        if (intervalId != null) {
            clearInterval(intervalId);
            intervalId = null;
        }
        console.log('停止');
    }

    function switchEmit() {
        if (!intervalId) {
            startEmit();
        } else {
            stopEmit();
        }
    }

    function getCode() {
        let code;
        if (turn == true) {
            code = BlocklyJS.workspaceToCode(friendRef.current.workspace);
        } else {
            code = BlocklyJS.workspaceToCode(enemyRef.current.workspace);
        }
        return code;
    }

    function doCode() {
        let workspace = friendRef.current.getDomText();
        setTurn(prevTurn => {
            stepRun();
            socket.emit('block-and-run', { block: friendRef.current.getDomText(), id: id, role: role });
            console.log('実行')
            return !prevTurn;
        })
        setTimeout(() => { friendRef.current.setXml(workspace); }, 1000);
    }

    function stepRun() {
        const code = getCode();
        let myInterpreter = new Interpreter(code, initFunc);
        function stepCode() {
            if (myInterpreter.step()) {
                window.setTimeout(stepCode, 30);
            }
        }
        stepCode();
    }

    let initFunc = function (interpreter, scope) {
        let wrapper = function (text) {
            return console_log(text);
        };
        interpreter.setProperty(scope, 'console_log', interpreter.createNativeFunction(wrapper));
        let go_left_wrapper = function () {
            return go_left();
        };
        interpreter.setProperty(scope, 'go_left', interpreter.createNativeFunction(go_left_wrapper));
        let go_right_wrapper = function () {
            return go_right();
        };
        interpreter.setProperty(scope, 'go_right', interpreter.createNativeFunction(go_right_wrapper));
        let go_up_wrapper = function () {
            return go_up();
        };
        interpreter.setProperty(scope, 'go_up', interpreter.createNativeFunction(go_up_wrapper));
        let go_down_wrapper = function () {
            return go_down();
        };
        interpreter.setProperty(scope, 'go_down', interpreter.createNativeFunction(go_down_wrapper));
        let put_obstacle_wrapper = function (direction) {
            return put_obstacle(direction);
        };
        interpreter.setProperty(scope, 'put_obstacle', interpreter.createNativeFunction(put_obstacle_wrapper));
    }

    function console_log(value) {
        console.log(value);
    }

    const go_left = () => {
        if (turn == true && first == true || turn == false && first == false) {
            setPlayer1(prevPlayer1 => {
                const x = prevPlayer1.x;
                const y = prevPlayer1.y;
                let resultY = y;
                if (y > 0 && field[x][y - 1].value == 0) {
                    resultY--;
                    setField(prevField => {
                        const array = prevField;
                        array[x][resultY].value = array[x][y].value;
                        array[x][y].value = 0;
                        return array;
                    });
                } else {
                    if (first == true) setMiss(prevMiss => prevMiss + 1);
                }
                return { x: x, y: resultY }
            });
        } else {
            setPlayer2(prevPlayer2 => {
                const x = prevPlayer2.x;
                const y = prevPlayer2.y;
                let resultY = y;
                if (y > 0 && field[x][y - 1].value == 0) {
                    resultY--;
                    setField(prevField => {
                        const array = prevField;
                        array[x][resultY].value = array[x][y].value;
                        array[x][y].value = 0;
                        return array;
                    });
                } else {
                    if (first != true) setMiss(prevMiss => prevMiss + 1);
                }
                return { x: x, y: resultY }
            });
        }
    }

    const go_right = () => {
        if (turn == true && first == true || turn == false && first == false) {
            setPlayer1(prevPlayer1 => {
                const x = prevPlayer1.x;
                const y = prevPlayer1.y;
                let resultY = y;
                if (y < fieldWidth - 1 && field[x][y + 1].value == 0) {
                    resultY++;
                    setField(prevField => {
                        const array = prevField;
                        array[x][resultY].value = array[x][y].value;
                        array[x][y].value = 0;
                        return array;
                    });
                } else {
                    if (first == true) setMiss(prevMiss => prevMiss + 1);
                }
                return { x: x, y: resultY }
            });
        } else {
            setPlayer2(prevPlayer2 => {
                const x = prevPlayer2.x;
                const y = prevPlayer2.y;
                let resultY = y;
                if (y < fieldWidth - 1 && field[x][y + 1].value == 0) {
                    resultY++;
                    setField(prevField => {
                        const array = prevField;
                        array[x][resultY].value = array[x][y].value;
                        array[x][y].value = 0;
                        return array;
                    });
                } else {
                    if (first != true) setMiss(prevMiss => prevMiss + 1);
                }
                return { x: x, y: resultY }
            });
        }
    }

    const go_up = () => {
        if (turn == true && first == true || turn == false && first == false) {
            setPlayer1(prevPlayer1 => {
                const x = prevPlayer1.x;
                const y = prevPlayer1.y;
                let resultX = x;
                if (x > 0 && field[x - 1][y].value == 0) {
                    resultX--;
                    setField(prevField => {
                        const array = prevField;
                        array[resultX][y].value = array[x][y].value;
                        array[x][y].value = 0;
                        return array;
                    });
                } else {
                    if (first == true) setMiss(prevMiss => prevMiss + 1);
                }
                return { x: resultX, y: y }
            });
        } else {
            setPlayer2(prevPlayer2 => {
                const x = prevPlayer2.x;
                const y = prevPlayer2.y;
                let resultX = x;
                if (x > 0 && field[x - 1][y].value == 0) {
                    resultX--;
                    setField(prevField => {
                        const array = prevField;
                        array[resultX][y].value = array[x][y].value;
                        array[x][y].value = 0;
                        return array;
                    });
                } else {
                    if (first != true) setMiss(prevMiss => prevMiss + 1);
                }
                return { x: resultX, y: y }
            });
        }
    }

    const go_down = () => {
        if (turn == true && first == true || turn == false && first == false) {
            setPlayer1(prevPlayer1 => {
                const x = prevPlayer1.x;
                const y = prevPlayer1.y;
                let resultX = x;
                if (x < fieldHeight - 1 && field[x + 1][y].value == 0) {
                    resultX++;
                    setField(prevField => {
                        const array = prevField;
                        array[resultX][y].value = array[x][y].value;
                        array[x][y].value = 0;
                        return array;
                    });
                } else {
                    if (first == true) setMiss(prevMiss => prevMiss + 1);
                }
                return { x: resultX, y: y }
            });
        } else {
            setPlayer2(prevPlayer2 => {
                const x = prevPlayer2.x;
                const y = prevPlayer2.y;
                let resultX = x;
                if (x < fieldHeight - 1 && field[x + 1][y].value == 0) {
                    resultX++;
                    setField(prevField => {
                        const array = prevField;
                        array[resultX][y].value = array[x][y].value;
                        array[x][y].value = 0;
                        return array;
                    });
                } else {
                    if (first != true) setMiss(prevMiss => prevMiss + 1);
                }
                return { x: resultX, y: y }
            });
        }
    }

    const put_obstacle = (direction) => {
        if (turn == true && first == true || turn == false && first == false) {
            setPlayer1(prevPlayer1 => {
                const x = prevPlayer1.x;
                const y = prevPlayer1.y;
                setField(prevField => {
                    const array = prevField;
                    switch (direction) {
                        case 'left':
                            if (y > 0 && array[x][y - 1].value == 0) {
                                array[x][y - 1].value = 10;
                            } else {
                                if (first == true) setMiss(prevMiss => prevMiss + 1);
                            }
                            break;
                        case 'right':
                            if (y < fieldWidth - 1 && array[x][y + 1].value == 0) {
                                array[x][y + 1].value = 10;
                            } else {
                                if (first == true) setMiss(prevMiss => prevMiss + 1);
                            }
                            break;
                        case 'up':
                            if (x > 0 && array[x - 1][y].value == 0) {
                                array[x - 1][y].value = 10;
                            } else {
                                if (first == true) setMiss(prevMiss => prevMiss + 1);
                            }
                            break;
                        case 'down':
                            if (x < fieldHeight - 1 && array[x + 1][y].value == 0) {
                                array[x + 1][y].value = 10;
                            } else {
                                if (first == true) setMiss(prevMiss => prevMiss + 1);
                            }
                            break;
                        default:
                            if (first == true) setMiss(prevMiss => prevMiss + 1);
                            break;
                    }
                    return array;
                });
                return { x: x, y: y }
            });
        } else {
            setPlayer2(prevPlayer2 => {
                const x = prevPlayer2.x;
                const y = prevPlayer2.y;
                setField(prevField => {
                    const array = prevField;
                    switch (direction) {
                        case 'left':
                            if (y > 0 && array[x][y - 1].value == 0) {
                                array[x][y - 1].value = 10;
                            } else {
                                if (first != true) setMiss(prevMiss => prevMiss + 1);
                            }
                            break;
                        case 'right':
                            if (y < fieldWidth - 1 && array[x][y + 1].value == 0) {
                                array[x][y + 1].value = 10;
                            } else {
                                if (first != true) setMiss(prevMiss => prevMiss + 1);
                            }
                            break;
                        case 'up':
                            if (x > 0 && array[x - 1][y].value == 0) {
                                array[x - 1][y].value = 10;
                            } else {
                                if (first != true) setMiss(prevMiss => prevMiss + 1);
                            }
                            break;
                        case 'down':
                            if (x < fieldHeight - 1 && array[x + 1][y].value == 0) {
                                array[x + 1][y].value = 10;
                            } else {
                                if (first != true) setMiss(prevMiss => prevMiss + 1);
                            }
                            break;
                        default:
                            if (first != true) setMiss(prevMiss => prevMiss + 1);
                            break;
                    }
                    return array;
                });
                return { x: x, y: y }
            });
        }
    }

    function RenderField(props) {
        return (
            <div className={styles.gameMap}>
                {props.field.map(rowPoints => (
                    rowPoints.map(point => (
                        <div className={styles.square} key={point.key}>
                            {point.value == 1 ? <Image src="/favicon.ico" alt="Vercel Logo" className={styles.player1} width={48} height={48} /> : null}
                            {point.value == 2 ? <Image src="/favicon.ico" alt="Vercel Logo" className={styles.player2} width={48} height={48} /> : null}
                            {point.value == 10 ? <Image src="/favicon.ico" alt="Vercel Logo" className={styles.wall} width={48} height={48} /> : null}
                        </div>
                    ))
                ))}
            </div>
        );
    }

    // 確認用
    const getMiss = () => {
        console.log(miss);
    }
    const getTurn = () => {
        console.log('turn:' + turn);
    }

    return (
        <>
            <Head>
                <title>ゲーム</title>
            </Head>
            <div className={styles.buttonClass}>
                <button onClick={getMiss}>ミスの回数</button>
                <button onClick={getTurn}>ターン確認</button>
                <button onClick={() => { socket.emit('game-finish') }}>ゲーム終了</button>
            </div>
            <RenderField field={field} />
            {driver && (
                <>
                    {turn && (
                        <>
                            <div className={styles.buttonClass}>
                                <button onClick={exBlock}>送信</button>
                                <button onClick={switchEmit}>開始 / 停止</button>
                                <button onClick={() => { doCode() }}>実行</button>
                            </div>
                            <BlocklyComponent ref={friendRef}
                                id={styles.blocklyDiv}
                                readOnly={false} trashcan={true}
                                move={{
                                    scrollbars: true,
                                    drag: true,
                                    wheel: true
                                }}
                                initialXml={`<xml xmlns="http://www.w3.org/1999/xhtml"></xml>`}
                            >
                                <Block type="go_left" />
                                <Block type="go_right" />
                                <Block type="go_up" />
                                <Block type="go_down" />
                                <Block type="put_obstacle" />
                                <Block type="get_left" />
                                <Block type="get_right" />
                                <Block type="get_up" />
                                <Block type="get_down" />
                                <Block type="controls_repeat_ext">
                                    <Value name="TIMES">
                                        <Shadow type="math_number">
                                            <Field name="NUM">3</Field>
                                        </Shadow>
                                    </Value>
                                </Block>
                            </BlocklyComponent>
                        </>
                    )}
                    {!turn && (
                        <>
                            <BlocklyComponent ref={friendRef}
                                id={styles.blocklyDiv} readOnly={true}
                                move={{
                                    scrollbars: true,
                                    drag: true,
                                    wheel: true
                                }}
                                initialXml={`<xml xmlns="http://www.w3.org/1999/xhtml"></xml>`}
                            ></BlocklyComponent>
                        </>
                    )}
                    <BlocklyComponent ref={enemyRef}></BlocklyComponent>
                </>
            )}
            {navigator && (
                <>
                    <BlocklyComponent ref={friendRef}
                        id={styles.readBlockly} readOnly={true}
                        move={{
                            scrollbars: true,
                            drag: true,
                            wheel: true
                        }}
                        initialXml={`<xml xmlns="http://www.w3.org/1999/xhtml"></xml>`}
                    >
                    </BlocklyComponent>
                    <BlocklyComponent ref={enemyRef}
                        id={styles.readBlockly} readOnly={true}
                        move={{
                            scrollbars: true,
                            drag: true,
                            wheel: true
                        }}
                        initialXml={`<xml xmlns="http://www.w3.org/1999/xhtml"></xml>`}
                    >
                    </BlocklyComponent>
                </>
            )}
        </>
    );
}
