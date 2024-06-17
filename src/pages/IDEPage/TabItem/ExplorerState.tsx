import { useAppDispatch, useAppSelector } from '@/hooks'
import { TreeNode } from '@/models/entry'
import { selectTree, setTree } from '@/store/ideSlice'
import { selectId, selectNickname } from '@/store/userSlice'
import { useCallback, useEffect, useRef } from 'react'
import yorkie, { Client, Document, Indexable, JSONArray } from 'yorkie-js-sdk'

type containerDoc = {
  tree: JSONArray<TreeNode>
  users: { [key: string]: string }
}

const ExplorerState = ({
  containerId,
}: {
  containerId: string | undefined
}) => {
  const tree = useAppSelector(selectTree)
  const dispatch = useAppDispatch()
  const yorkieClientRef = useRef<Client>()
  const yorkieDocRef = useRef<Document<containerDoc, Indexable>>()

  const userId = useAppSelector(selectId)
  const userNickname = useAppSelector(selectNickname)

  const initializeYorkieExplorer = useCallback(async () => {
    // // 1. 클라이언트 생성 및 활성화
    const client = new yorkie.Client('https://api.yorkie.dev', {
      apiKey: import.meta.env.VITE_YORKIE_API_KEY,
    })

    await client.activate()
    yorkieClientRef.current = client

    // 2. 클라이언트와 연결된 문서 생성
    const doc = new yorkie.Document<containerDoc>(
      `FileTree-${containerId}-${new Date()
        .toISOString()
        .substring(0, 10)
        .replace(/-/g, '')}`,
      {
        enableDevtools: true,
      }
    )

    yorkieDocRef.current = doc

    await client.attach(doc, {
      initialPresence: { username: userNickname },
    })

    doc.update(root => {
      // 해당 키의 문서에 content가 없으면 새로운 Text 생성
      if (!root.tree) {
        root.tree = []

        // 기존에 저장된 트리 삽입
        for (const treeNode of tree!) {
          root.tree.push(treeNode)
        }
      }

      // 해당 키의 문서에 user가 없으면 초기값 할당
      if (!root.users) {
        root.users = {}
      }

      // TODO - 현재 유저가 이 컨테이너의 생성자가 아닐 경우 viewer 권한 부여
      root.users[userId] = 'admin'
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

    doc.subscribe('presence', event => {
      const users = doc.getPresences()
      console.log(users)
    })

    await client.sync()

    syncFileTree()
  }, [containerId])

  useEffect(() => {
    initializeYorkieExplorer()

    return () => {
      if (yorkieClientRef.current && yorkieDocRef.current)
        yorkieClientRef.current.detach(yorkieDocRef.current)
    }
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
