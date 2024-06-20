import { useAppDispatch, useAppSelector } from '@/hooks'
import { selectFileExecuteResult, setFileExecuteResult } from '@/store/ideSlice'
import { Client, IMessage } from '@stomp/stompjs'
import { Terminal as xterm } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { useEffect, useRef } from 'react'

const BASE_URI = 'ws://localhost:8080'

const Terminal = ({ containerId }: { containerId: string | undefined }) => {
  const terminalRef = useRef(null)
  const terminal = useRef<xterm>()
  const fileExecuteResult = useAppSelector(selectFileExecuteResult)
  const dispatch = useAppDispatch()

  const clientRef = useRef<Client | null>(null)
  const currentCommandRef = useRef<string>('')
  const isConnected = useRef<boolean>(false)

  // 터미널 초기 세팅
  useEffect(() => {
    terminal.current = new xterm({
      cursorBlink: true,
    })
    terminal.current.open(terminalRef.current!)
    terminal.current.resize(120, 12)
    terminal.current.write('$ ')

    terminal.current.onKey(({ key, domEvent }) => {
      const printable =
        !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey

      if (domEvent.key === 'Enter') {
        sendCommand()
      } else if (domEvent.key === 'Backspace') {
        // Do not delete the prompt
        if (terminal.current!.buffer.active.cursorX > 2) {
          terminal.current!.write('\b \b')
          currentCommandRef.current = currentCommandRef.current.slice(0, -1)
        }
      } else if (printable) {
        terminal.current!.write(key)
        currentCommandRef.current += key
      }
    })

    return () => {
      terminal.current!.dispose()
    }
  }, [])

  // socket 클라이언트 생성
  useEffect(() => {
    const client = new Client({
      brokerURL: `${BASE_URI}/api/ws`,
      beforeConnect: () => console.log('[Terminal] Attempting to connect...'),
      onConnect: () => handleWebSocketConnect(client),
      onDisconnect: () => handleWebSocketDisconnect(client),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: str => console.debug(str),
      onWebSocketClose: () => {
        console.error('[Terminal] WebSocket connection closed')
        isConnected.current = false
      },
      onStompError: frame => {
        console.error(
          '[Terminal] Broker reported error: ' + frame.headers['message']
        )
        console.error('[Terminal] Additional details: ' + frame.body)
      },
      onWebSocketError: event => {
        console.error('[Terminal] WebSocket error', event)
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      console.log(
        '[Terminal] Component unmounting, deactivating WebSocket connection...'
      )
      if (client) {
        client.deactivate()
      }
    }
  }, [])

  const handleWebSocketConnect = (client: Client) => {
    console.log('[Terminal] Connected to WebSocket')
    isConnected.current = true

    // 구독
    client.subscribe(
      `/api/sub/terminal/${containerId}`,
      (message: IMessage) => {
        const newMessage = JSON.parse(message.body)
        const result = newMessage.result.split('\n')

        for (const line of result) {
          terminal.current!.writeln(line)
        }
        terminal.current!.write('\r$ ')
      }
    )
  }

  const sendCommand = () => {
    // 빈 문자열은 보내지 않는다.
    if (currentCommandRef.current === '') return

    // 연결이 되어있지 않으면 보내지 않는다.
    if (!clientRef.current || !isConnected) return

    // 발행
    clientRef.current.publish({
      destination: `/api/pub/terminal/${containerId}`,
      body: JSON.stringify({
        command: currentCommandRef.current.trim(),
      }),
    })
    currentCommandRef.current = ''
    terminal.current!.write('\r\n$ ')
  }

  const handleWebSocketDisconnect = (client: Client) => {
    console.log('[Terminal] Disconnected from WebSocket')

    isConnected.current = false
    client.deactivate()
  }

  // 실행 버튼 클릭으로 파일이 실행되었을 때의 결과
  useEffect(() => {
    if (fileExecuteResult) {
      terminal.current!.write(`\r\n${fileExecuteResult}`)
      terminal.current!.write('\r$ ')
      dispatch(setFileExecuteResult(''))
    }
  }, [fileExecuteResult])

  return <div ref={terminalRef} />
}

export default Terminal
