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

const EMPTY = 0;
const PLAYER1 = 1;
const PLAYER2 = 2;
const OBSTACLE = 10;
const OBSTACLE_NUMBER = 2;

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
    const [miss1, setMiss1] = useState(0);
    const [miss2, setMiss2] = useState(0);
    const [first, setFirst] = useState(false);
    const [turn, setTurn] = useState(1);
    const [myturn, setMyTurn] = useState(false);
    const [driver, setDriver] = useState(() => role == "d1" || role == "d2" ? true : false);
    const [navigator, setNavigator] = useState(() => role == "n1" || role == "n2" ? true : false);
    const [finish, setFinish] = useState(false);
    const [result, setResult] = useState(0);
    const [number, setNumber] = useState(OBSTACLE_NUMBER);

    useEffect(() => {
        let array = [];
        for (let i = 0; i < fieldHeight; i++) {
            array[i] = [];
            for (let j = 0; j < fieldWidth; j++) {
                array[i][j] = {
                    key: '(' + i + ',' + j + ')',
                    value: EMPTY
                }
            }
        }
        array[defaultX1][defaultY1].value = PLAYER1;
        array[defaultX2][defaultY2].value = PLAYER2;
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
            socket.off('result-router');
        }
    });

    const socketInitializer = () => {
        socket.on('you-are-first', first => {
            setFirst(first);
            setMyTurn(first);
            if (first == true && (role == 'd1' || role == 'd2')) {
                console.log('あなたは先行です');
                startEmit();
            }
        })

        socket.on('friend-block', msg => {
            friendRef.current.workspace.clear();
            friendRef.current.setXml(msg.blockXml);
            console.log('friend-updated');
            if (msg.run == true) {
                setMyTurn(prevMyTurn => {
                    stepRun(!prevMyTurn);
                    return !prevMyTurn;
                });
            }
        })

        socket.on('enemy-block', msg => {
            enemyRef.current.workspace.clear();
            enemyRef.current.setXml(msg.blockXml);
            console.log('enemy-updated');
            if (msg.run == true) {
                setMyTurn(prevMyTurn => {
                    stepRun(!prevMyTurn);
                    return !prevMyTurn;
                });
            }
        })

        socket.on('result-router', () => {
            setFinish(true);
            stopEmit();
        })
    }

    const exBlock = () => {
        console.log('送信')
        socket.emit('blocks', { block: friendRef.current.getDomText(), id: id, role: role, run: false })
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
            console.log('停止');
        }
    }

    function switchEmit() {
        if (!intervalId) {
            startEmit();
        } else {
            stopEmit();
        }
    }

    function initTurn() {
        setNumber(OBSTACLE_NUMBER);
    }

    function judgeResult() {
        let x;
        let y;
        let flag1 = 0;
        let flag2 = 0;
        setField(prevField => {
            const array = prevField;
            setPlayer1(prevPlayer1 => {
                setPlayer2(prevPlayer2 => {
                    for (let i = 1; i <= 2; i++) {
                        eval("x = prevPlayer" + i + ".x;");
                        eval("y = prevPlayer" + i + ".y;");
                        console.log(x + ',' + y);
                        if (0 < x && x < fieldHeight - 1 && 0 < y && y < fieldWidth - 1 && (array[x][y - 1].value != EMPTY && array[x][y + 1].value != EMPTY && array[x - 1][y].value != EMPTY && array[x + 1][y].value != EMPTY)
                            || x == 0 && y == 0 && (array[x][y + 1].value != EMPTY && array[x + 1][y].value != EMPTY)
                            || x == 0 && y == fieldWidth - 1 && (array[x][y - 1].value != EMPTY && array[x + 1][y].value != EMPTY)
                            || x == fieldHeight - 1 && y == 0 && (array[x][y + 1].value != EMPTY && array[x - 1][y].value != EMPTY)
                            || x == fieldHeight - 1 && y == fieldWidth - 1 && (array[x][y - 1].value != EMPTY && array[x - 1][y].value != EMPTY)
                            || x == 0 && 0 < y && y < fieldWidth - 1 && (array[x][y - 1].value != EMPTY && array[x][y + 1].value != EMPTY && array[x + 1][y].value != EMPTY)
                            || x == fieldHeight - 1 && 0 < y && y < fieldWidth - 1 && (array[x][y - 1].value != EMPTY && array[x][y + 1].value != EMPTY && array[x - 1][y].value != EMPTY)
                            || 0 < x && x < fieldHeight - 1 && y == 0 && (array[x][y + 1].value != EMPTY && array[x - 1][y].value != EMPTY && array[x + 1][y].value != EMPTY)
                            || 0 < x && x < fieldHeight - 1 && y == fieldWidth - 1 && (array[x][y - 1].value != EMPTY && array[x - 1][y].value != EMPTY && array[x + 1][y].value != EMPTY)) {
                            eval("flag" + i + "= 1;");
                        }
                    }
                    return { x: prevPlayer2.x, y: prevPlayer2.y }
                })
                return { x: prevPlayer1.x, y: prevPlayer1.y }
            })
            if (flag1 == 1 && flag2 == 1) {
                setResult(0);
                socket.emit('game-finish', { id: id });
            } else if (flag1 == 0 && flag2 == 1) {
                setResult(1);
                socket.emit('game-finish', { id: id });
            } else if (flag1 == 1 && flag2 == 0) {
                setResult(2);
                socket.emit('game-finish', { id: id });
            }
            return array;
        })
    }

    function getCode(myturn) {
        let code;
        if (myturn == true) {
            code = BlocklyJS.workspaceToCode(friendRef.current.workspace);
        } else {
            code = BlocklyJS.workspaceToCode(enemyRef.current.workspace);
        }
        return 'initTurn();\n' + code + 'judgeResult();\n';
    }

    function doCode() {
        let workspace = friendRef.current.getDomText();
        setMyTurn(prevMyTurn => {
            stepRun(!prevMyTurn);
            socket.emit('blocks', { block: friendRef.current.getDomText(), id: id, role: role, run: true });
            console.log('実行')
            return !prevMyTurn;
        })
        setTimeout(() => { friendRef.current.setXml(workspace); }, 1000);
    }

    function stepRun(myturn) {
        setTurn(prevTurn => {
            if (prevTurn >= 2) {
                const code = getCode(myturn);
                let myInterpreter = new Interpreter(code, initFunc);
                function stepCode() {
                    if (myInterpreter.step()) {
                        window.setTimeout(stepCode, 30);
                    }
                }
                stepCode();
            }
            if (role == 'd1' || role == 'd2') {
                switchEmit();
            }
            return prevTurn + 1;
        })
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
        let judge_wrapper = function () {
            return judgeResult();
        };
        interpreter.setProperty(scope, 'judgeResult', interpreter.createNativeFunction(judge_wrapper));
        let init_wrapper = function () {
            return initTurn();
        };
        interpreter.setProperty(scope, 'initTurn', interpreter.createNativeFunction(init_wrapper));
        let check_wrapper = function (direction, object) {
            return check_object(direction, object);
        };
        interpreter.setProperty(scope, 'check_object', interpreter.createNativeFunction(check_wrapper));
        interpreter.setProperty(scope, 'OBSTACLE', OBSTACLE);
    }

    function console_log(value) {
        console.log(value);
    }

    const go_left = () => {
        if (myturn == true && first == false || myturn == false && first == true) {
            setPlayer1(prevPlayer1 => {
                const x = prevPlayer1.x;
                const y = prevPlayer1.y;
                let resultY = y;
                if (y > 0 && field[x][y - 1].value == EMPTY) {
                    resultY--;
                    setField(prevField => {
                        const array = prevField;
                        array[x][resultY].value = array[x][y].value;
                        array[x][y].value = EMPTY;
                        return array;
                    });
                } else {
                    setMiss1(prevMiss1 => prevMiss1 + 1);
                }
                return { x: x, y: resultY }
            });
        } else {
            setPlayer2(prevPlayer2 => {
                const x = prevPlayer2.x;
                const y = prevPlayer2.y;
                let resultY = y;
                if (y > 0 && field[x][y - 1].value == EMPTY) {
                    resultY--;
                    setField(prevField => {
                        const array = prevField;
                        array[x][resultY].value = array[x][y].value;
                        array[x][y].value = EMPTY;
                        return array;
                    });
                } else {
                    setMiss2(prevMiss2 => prevMiss2 + 1);
                }
                return { x: x, y: resultY }
            });
        }
    }

    const go_right = () => {
        if (myturn == true && first == false || myturn == false && first == true) {
            setPlayer1(prevPlayer1 => {
                const x = prevPlayer1.x;
                const y = prevPlayer1.y;
                let resultY = y;
                if (y < fieldWidth - 1 && field[x][y + 1].value == EMPTY) {
                    resultY++;
                    setField(prevField => {
                        const array = prevField;
                        array[x][resultY].value = array[x][y].value;
                        array[x][y].value = EMPTY;
                        return array;
                    });
                } else {
                    setMiss1(prevMiss1 => prevMiss1 + 1);
                }
                return { x: x, y: resultY }
            });
        } else {
            setPlayer2(prevPlayer2 => {
                const x = prevPlayer2.x;
                const y = prevPlayer2.y;
                let resultY = y;
                if (y < fieldWidth - 1 && field[x][y + 1].value == EMPTY) {
                    resultY++;
                    setField(prevField => {
                        const array = prevField;
                        array[x][resultY].value = array[x][y].value;
                        array[x][y].value = EMPTY;
                        return array;
                    });
                } else {
                    setMiss2(prevMiss2 => prevMiss2 + 1);
                }
                return { x: x, y: resultY }
            });
        }
    }

    const go_up = () => {
        if (myturn == true && first == false || myturn == false && first == true) {
            setPlayer1(prevPlayer1 => {
                const x = prevPlayer1.x;
                const y = prevPlayer1.y;
                let resultX = x;
                if (x > 0 && field[x - 1][y].value == EMPTY) {
                    resultX--;
                    setField(prevField => {
                        const array = prevField;
                        array[resultX][y].value = array[x][y].value;
                        array[x][y].value = EMPTY;
                        return array;
                    });
                } else {
                    setMiss1(prevMiss1 => prevMiss1 + 1);
                }
                return { x: resultX, y: y }
            });
        } else {
            setPlayer2(prevPlayer2 => {
                const x = prevPlayer2.x;
                const y = prevPlayer2.y;
                let resultX = x;
                if (x > 0 && field[x - 1][y].value == EMPTY) {
                    resultX--;
                    setField(prevField => {
                        const array = prevField;
                        array[resultX][y].value = array[x][y].value;
                        array[x][y].value = EMPTY;
                        return array;
                    });
                } else {
                    setMiss2(prevMiss2 => prevMiss2 + 1);
                }
                return { x: resultX, y: y }
            });
        }
    }

    const go_down = () => {
        if (myturn == true && first == false || myturn == false && first == true) {
            setPlayer1(prevPlayer1 => {
                const x = prevPlayer1.x;
                const y = prevPlayer1.y;
                let resultX = x;
                if (x < fieldHeight - 1 && field[x + 1][y].value == EMPTY) {
                    resultX++;
                    setField(prevField => {
                        const array = prevField;
                        array[resultX][y].value = array[x][y].value;
                        array[x][y].value = EMPTY;
                        return array;
                    });
                } else {
                    setMiss1(prevMiss1 => prevMiss1 + 1);
                }
                return { x: resultX, y: y }
            });
        } else {
            setPlayer2(prevPlayer2 => {
                const x = prevPlayer2.x;
                const y = prevPlayer2.y;
                let resultX = x;
                if (x < fieldHeight - 1 && field[x + 1][y].value == EMPTY) {
                    resultX++;
                    setField(prevField => {
                        const array = prevField;
                        array[resultX][y].value = array[x][y].value;
                        array[x][y].value = EMPTY;
                        return array;
                    });
                } else {
                    setMiss2(prevMiss2 => prevMiss2 + 1);
                }
                return { x: resultX, y: y }
            });
        }
    }

    const put_obstacle = (direction) => {
        if (myturn == true && first == false || myturn == false && first == true) {
            setNumber(prevNumber => {
                if (prevNumber > 0) {
                    setPlayer1(prevPlayer1 => {
                        const x = prevPlayer1.x;
                        const y = prevPlayer1.y;
                        setField(prevField => {
                            const array = prevField;
                            switch (direction) {
                                case 'left':
                                    if (y > 0 && array[x][y - 1].value == EMPTY) {
                                        array[x][y - 1].value = OBSTACLE;
                                        prevNumber--;
                                    } else {
                                        setMiss1(prevMiss1 => prevMiss1 + 1);
                                    }
                                    break;
                                case 'right':
                                    if (y < fieldWidth - 1 && array[x][y + 1].value == EMPTY) {
                                        array[x][y + 1].value = OBSTACLE;
                                        prevNumber--;
                                    } else {
                                        setMiss1(prevMiss1 => prevMiss1 + 1);
                                    }
                                    break;
                                case 'up':
                                    if (x > 0 && array[x - 1][y].value == EMPTY) {
                                        array[x - 1][y].value = OBSTACLE;
                                        prevNumber--;
                                    } else {
                                        setMiss1(prevMiss1 => prevMiss1 + 1);
                                    }
                                    break;
                                case 'down':
                                    if (x < fieldHeight - 1 && array[x + 1][y].value == EMPTY) {
                                        array[x + 1][y].value = OBSTACLE;
                                        prevNumber--;
                                    } else {
                                        setMiss1(prevMiss1 => prevMiss1 + 1);
                                    }
                                    break;
                                default:
                                    setMiss1(prevMiss1 => prevMiss1 + 1);
                                    break;
                            }
                            return array;
                        });
                        return { x: x, y: y }
                    });
                } else {
                    setMiss1(prevMiss1 => prevMiss1 + 1);
                }
                return prevNumber;
            });
        } else {
            setNumber(prevNumber => {
                if (prevNumber > 0) {
                    setPlayer2(prevPlayer2 => {
                        const x = prevPlayer2.x;
                        const y = prevPlayer2.y;
                        setField(prevField => {
                            const array = prevField;
                            switch (direction) {
                                case 'left':
                                    if (y > 0 && array[x][y - 1].value == EMPTY) {
                                        array[x][y - 1].value = OBSTACLE;
                                        prevNumber--;
                                    } else {
                                        setMiss2(prevMiss2 => prevMiss2 + 1);
                                    }
                                    break;
                                case 'right':
                                    if (y < fieldWidth - 1 && array[x][y + 1].value == EMPTY) {
                                        array[x][y + 1].value = OBSTACLE;
                                        prevNumber--;
                                    } else {
                                        setMiss2(prevMiss2 => prevMiss2 + 1);
                                    }
                                    break;
                                case 'up':
                                    if (x > 0 && array[x - 1][y].value == EMPTY) {
                                        array[x - 1][y].value = OBSTACLE;
                                        prevNumber--;
                                    } else {
                                        setMiss2(prevMiss2 => prevMiss2 + 1);
                                    }
                                    break;
                                case 'down':
                                    if (x < fieldHeight - 1 && array[x + 1][y].value == EMPTY) {
                                        array[x + 1][y].value = OBSTACLE;
                                        prevNumber--;
                                    } else {
                                        setMiss2(prevMiss2 => prevMiss2 + 1);
                                    }
                                    break;
                                default:
                                    setMiss2(prevMiss2 => prevMiss2 + 1);
                                    break;
                            }
                            return array;
                        });
                        return { x: x, y: y }
                    });
                } else {
                    setMiss2(prevMiss2 => prevMiss2 + 1);
                }
                return prevNumber;
            });
        }
    }

    const check_object = (direction, object) => {
        let value;
        if (myturn == true && first == false || myturn == false && first == true) {
            if (direction == null || object == null) {
                setMiss1(prevMiss1 => prevMiss1 + 1);
                return false;
            }
            setPlayer1(prevPlayer1 => {
                const x = prevPlayer1.x;
                const y = prevPlayer1.y;
                setField(prevField => {
                    switch (direction) {
                        case 'left':
                            if (y > 0) { value = prevField[x][y - 1].value; } else { value = null; }
                            break;
                        case 'right':
                            if (y < fieldWidth - 1) { value = prevField[x][y + 1].value; } else { value = null; }
                            break;
                        case 'up':
                            if (x > 0) { value = prevField[x - 1][y].value; } else { value = null; }
                            break;
                        case 'down':
                            if (x < fieldHeight - 1) { value = prevField[x + 1][y].value; } else { value = null; }
                            break;
                        default:
                            break;
                    }
                    return prevField;
                });
                return prevPlayer1;
            });
        } else {
            if (direction == null || object == null) {
                setMiss2(prevMiss2 => prevMiss2 + 1);
                return false;
            }
            setPlayer2(prevPlayer2 => {
                const x = prevPlayer2.x;
                const y = prevPlayer2.y;
                setField(prevField => {
                    switch (direction) {
                        case 'left':
                            if (y > 0) { value = prevField[x][y - 1].value; } else { value = null; }
                            break;
                        case 'right':
                            if (y < fieldWidth - 1) { value = prevField[x][y + 1].value; } else { value = null; }
                            break;
                        case 'up':
                            if (x > 0) { value = prevField[x - 1][y].value; } else { value = null; }
                            break;
                        case 'down':
                            if (x < fieldHeight - 1) { value = prevField[x + 1][y].value; } else { value = null; }
                            break;
                        default:
                            break;
                    }
                    return prevField;
                });
                return prevPlayer2;
            });
        }
        if (object == 'PLAYER') {
            if (PLAYER1 == value || PLAYER2 == value) {
                return true;
            }
        } else if (object == value) {
            return true;
        }
        return false;
    }

    function RenderField(props) {
        return (
            <div className={styles.gameMap}>
                {props.field.map(rowPoints => (
                    rowPoints.map(point => (
                        <div className={styles.square} key={point.key}>
                            {point.value == PLAYER1 ? <Image src="/favicon.ico" alt="Vercel Logo" className={styles.player1} width={48} height={48} /> : null}
                            {point.value == PLAYER2 ? <Image src="/favicon.ico" alt="Vercel Logo" className={styles.player2} width={48} height={48} /> : null}
                            {point.value == OBSTACLE ? <Image src="/favicon.ico" alt="Vercel Logo" className={styles.wall} width={48} height={48} /> : null}
                        </div>
                    ))
                ))}
            </div>
        );
    }

    // 確認用
    const getMiss = () => {
        console.log('ミスの回数{team1:' + miss1 + ', team2:' + miss2 + '}');
    }
    const getMyTurn = () => {
        console.log('myturn:' + myturn + ',turn数:' + turn);
    }

    return (
        <>
            <Head>
                <title>ゲーム</title>
            </Head>
            <div className={styles.buttonClass}>
                <button onClick={getMiss}>ミスの回数</button>
                <button onClick={getMyTurn}>ターン確認</button>
                {finish &&
                    <button onClick={() => {
                        router.push({ pathname: 'result', query: { result: result, miss1: miss1, miss2: miss2, turn: turn } }, 'result');
                    }}>結果画面へ
                    </button>
                }
            </div>
            <RenderField field={field} />
            {driver && (
                <>
                    {myturn && (
                        <>
                            {!finish &&
                                <div className={styles.buttonClass}>
                                    <button onClick={() => { friendRef.current.workspace.clear(); }}>消去</button>
                                    <button onClick={() => { doCode() }}>決定</button>
                                </div>
                            }
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
                                <Block type="check_object" />
                                <Block type="obstacle" />
                                <Block type="player" />
                                <Block type="controls_repeat_ext">
                                    <Value name="TIMES">
                                        <Shadow type="math_number">
                                            <Field name="NUM">3</Field>
                                        </Shadow>
                                    </Value>
                                </Block>
                                <Block type="controls_if" />
                            </BlocklyComponent>
                        </>
                    )}
                    {!myturn && (
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
