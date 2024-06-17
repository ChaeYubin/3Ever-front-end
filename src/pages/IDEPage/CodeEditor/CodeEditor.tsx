import { Box } from '@chakra-ui/react'
import { EditorState, Transaction } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { useCallback, useEffect, useRef } from 'react'
import { javascript } from '@codemirror/lang-javascript'
import { cpp } from '@codemirror/lang-cpp'
import { java } from '@codemirror/lang-java'
import { python } from '@codemirror/lang-python'
import { githubLight } from '@uiw/codemirror-theme-github'
import './code-editor.css'
import { LanguageSupport } from '@codemirror/language'
import { showMinimap } from '@replit/codemirror-minimap'
import yorkie, { type Text } from 'yorkie-js-sdk'
import { useAppDispatch, useAppSelector } from '@/hooks'
import { selectCurrentFile, setCurrentFile } from '@/store/ideSlice'

type YorkieDoc = {
  content: Text
}

const EXTENSIONS: { [key: string]: LanguageSupport } = {
  python: python(),
  javascript: javascript(),
  cpp: cpp(),
  java: java(),
}

const CodeEditor = ({
  language,
  containerId,
}: {
  language: string
  containerId: string | undefined
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const codemirrorViewRef = useRef<EditorView>()

  const currentFile = useAppSelector(selectCurrentFile)
  const dispatch = useAppDispatch()

  const initializeYorkieEditor = useCallback(async () => {
    // 1. 클라이언트 생성 및 활성화
    const client = new yorkie.Client('https://api.yorkie.dev', {
      apiKey: import.meta.env.VITE_YORKIE_API_KEY,
    })

    await client.activate()

    // 2. 클라이언트와 연결된 문서 생성
    const doc = new yorkie.Document<YorkieDoc>(
      `File-${containerId}-${currentFile?.id}-${new Date()
        .toISOString()
        .substring(0, 10)
        .replace(/-/g, '')}`,
      {
        enableDevtools: true,
      }
    )

    await client.attach(doc, {})

    // 3. 해당 키의 문서에 content가 없으면 새로운 Text 생성
    doc.update(root => {
      if (!root.content) {
        root.content = new yorkie.Text()

        // 기존에 저장된 코드 삽입
        root.content.edit(0, 0, currentFile?.metadata?.content || '')
      } else {
        dispatch(
          setCurrentFile({
            ...currentFile!,
            metadata: {
              isDirectory: false,
              content: root.content.toString(),
            },
          })
        )
      }
    }, 'create content if not exists')

    // 4. 문서의 변경 이벤트 구독
    // 문서 내용을 CodeMirror 에디터에 동기화
    const syncText = () => {
      const text = doc.getRoot().content

      codemirrorViewRef.current?.dispatch({
        changes: {
          from: 0,
          to: codemirrorViewRef.current.state.doc.length,
          insert: text.toString(),
        },
        annotations: [Transaction.remote.of(true)],
      })
    }

    doc.subscribe(event => {
      if (event.type === 'remote-change') {
        syncText()
      }
    })

    await client.sync()

    // 5. local의 변경 사항을 remote에 broadcast하기 위한 함수
    const updateListener = EditorView.updateListener.of(viewUpdate => {
      if (viewUpdate.docChanged) {
        for (const tr of viewUpdate.transactions) {
          const events = ['select', 'input', 'delete', 'move', 'undo', 'redo']
          if (!events.map(event => tr.isUserEvent(event)).some(Boolean)) {
            continue
          }
          if (tr.annotation(Transaction.remote)) {
            continue
          }
          let adj = 0
          tr.changes.iterChanges((fromA, toA, _, __, inserted) => {
            const insertText = inserted.toJSON().join('\n')
            doc.update(root => {
              root.content.edit(fromA + adj, toA + adj, insertText)
            }, `update content byA ${client.getID()}`)
            adj += insertText.length - (toA - fromA)

            doc.update(root => {
              dispatch(
                setCurrentFile({
                  ...currentFile!,
                  metadata: {
                    isDirectory: false,
                    content: root.content.toString(),
                  },
                })
              )
            })
          })
        }
      }
    })

    // 6. CodeMirror 인스턴스 생성

    // minimap 설정을 위한 코드
    const create = (_: EditorView) => {
      const dom = document.createElement('div')
      return { dom }
    }

    const state = EditorState.create({
      doc: doc.getRoot().content.toString(),
      extensions: [
        basicSetup,
        EXTENSIONS[language],
        githubLight,
        // minimap scrollbar
        showMinimap.compute(['doc'], _ => {
          return {
            create,
            /* optional */
            displayText: 'characters',
            showOverlay: 'always',
          }
        }),
        updateListener,
      ],
    })

    codemirrorViewRef.current = new EditorView({
      state,
      parent: editorRef.current ? editorRef.current : undefined,
    })

    syncText()
  }, [containerId, currentFile, language])

  useEffect(() => {
    initializeYorkieEditor()

    // Cleanup function to destroy the editor when the component unmounts
    return () => {
      if (codemirrorViewRef.current) {
        codemirrorViewRef.current.destroy()
      }
    }
  }, [containerId, currentFile!.id])

  return <Box ref={editorRef} minH="calc(100vh - 285px)" width="100%"></Box>
}

export default CodeEditor
