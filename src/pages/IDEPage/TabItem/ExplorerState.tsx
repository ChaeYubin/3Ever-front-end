import { useAppDispatch, useAppSelector } from '@/hooks'
import { TreeNode } from '@/models/entry'
import yorkieClient from '@/services/yorkie'
import { selectTree, setTree } from '@/store/ideSlice'
import { useCallback, useEffect, useRef } from 'react'
import yorkie, { Document, Indexable, JSONArray } from 'yorkie-js-sdk'

type FileTreeDoc = {
  tree: JSONArray<TreeNode>
}

const ExplorerState = ({
  containerId,
}: {
  containerId: string | undefined
}) => {
  const tree = useAppSelector(selectTree)
  const dispatch = useAppDispatch()
  const yorkieDocRef = useRef<Document<FileTreeDoc, Indexable>>()

  const initializeYorkieEditor = useCallback(async () => {
    // // 1. 클라이언트 생성 및 활성화
    // const client = new yorkie.Client('https://api.yorkie.dev', {
    //   apiKey: import.meta.env.VITE_YORKIE_API_KEY,
    // })

    await yorkieClient.activate()

    // 2. 클라이언트와 연결된 문서 생성
    const doc = new yorkie.Document<FileTreeDoc>(
      `FileTree-${containerId}-${new Date()
        .toISOString()
        .substring(0, 10)
        .replace(/-/g, '')}`,
      {
        enableDevtools: true,
      }
    )

    yorkieDocRef.current = doc

    await yorkieClient.attach(doc, {})

    // 3. 해당 키의 문서에 content가 없으면 새로운 Text 생성
    doc.update(root => {
      if (!root.tree) {
        root.tree = []

        // 기존에 저장된 트리 삽입
        for (const treeNode of tree!) {
          root.tree.push(treeNode)
        }
      }
    }, 'create content if not exists')

    // 4. 문서의 변경 이벤트 구독
    const syncFileTree = () => {
      const tree = doc.getRoot().tree
      const newTree = JSON.parse(`[${tree.toString()}]`)
      dispatch(setTree(newTree))
    }

    doc.subscribe(event => {
      if (event.type === 'remote-change') {
        syncFileTree()
      }
    })

    await yorkieClient.sync()

    syncFileTree()
  }, [containerId])

  useEffect(() => {
    initializeYorkieEditor()
  }, [containerId])

  // local 조작에 의해 tree 상태가 바뀌면 remote 문서를 update
  useEffect(() => {
    if (yorkieDocRef.current !== undefined) {
      const remoteTree = `[${yorkieDocRef.current.getRoot().tree.toString()}]`

      // local에서 바꾼 경우, 이어지는 remote change에 의해 순환상태에 빠지는 걸 막기 위한 return문
      if (JSON.stringify(tree) === remoteTree) {
        return
      }

      yorkieDocRef.current!.update(root => {
        root.tree = [] as JSONArray<TreeNode>

        for (const treeNode of tree!) {
          root.tree.push(treeNode)
        }
      })
    }
  }, [tree])

  return <></>
}

export default ExplorerState
