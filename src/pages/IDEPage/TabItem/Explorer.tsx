import {
  Box,
  Flex,
  IconButton,
  Input,
  Menu,
  MenuItem,
  MenuList,
  Spacer,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import Modal from '@/components/Modal'
import { FiFolderPlus } from 'react-icons/fi'
import { FiFilePlus } from 'react-icons/fi'
import { IoLogoJavascript } from 'react-icons/io5'
import { FaJava } from 'react-icons/fa'
import { PiFileCpp } from 'react-icons/pi'
import { DiPython } from 'react-icons/di'
import { IoCodeSlashOutline } from 'react-icons/io5'
import { FaRegFolder, FaRegFolderOpen } from 'react-icons/fa'
import TreeView, {
  ITreeViewOnNodeSelectProps,
  flattenTree,
} from 'react-accessible-treeview'
import './treeview.css'
import { useAppDispatch, useAppSelector } from '@/hooks'
import {
  selectSelectedNode,
  selectTree,
  setSelectedNode,
  setTree,
} from '@/store/ideSlice'
import { useRef, useState } from 'react'
import { createEntry, deleteEntry, editEntryName } from '@/services/entry'
import { Tree, TreeNode } from '@/models/entry'
import { getExtension } from '@/utils/entry'

const Explorer = ({ containerId }: { containerId: string | undefined }) => {
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const {
    isOpen: isMenuOpen,
    onOpen: onMenuOpen,
    onClose: onMenuClose,
  } = useDisclosure()
  const {
    isOpen: isEditNameModalOpen,
    onOpen: onEditNameModalOpen,
    onClose: onEditNameModalClose,
  } = useDisclosure()
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
  } = useDisclosure()

  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [contextClickElementId, setContextClickElementId] = useState(0)

  const dispatch = useAppDispatch()
  const selectedNode = useAppSelector(selectSelectedNode)
  const tree = useAppSelector(selectTree)

  const selectedTreeNodeRef = useRef<HTMLDivElement>(null)

  const [newEntryName, setNewEntryName] = useState('')
  const [newEntryType, setNewEntryType] = useState('')

  const FolderIcon = ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? (
      <FaRegFolderOpen color="e8a87c" className="icon" />
    ) : (
      <FaRegFolder color="e8a87c" className="icon" />
    )

  const FileIcon = ({ filename }: { filename: string }) => {
    const extension = getExtension(filename)
    switch (extension) {
      case 'js':
        return <IoLogoJavascript color="#ECC94B" className="icon" />
      case 'java':
        return <FaJava color="orange" className="icon" />
      case 'py':
        return <DiPython color="green" className="icon" />
      case 'cpp':
        return <PiFileCpp color="blue" className="icon" />
      case 'c':
        return <IoCodeSlashOutline color="gray" className="icon" />
      default:
        return <IoCodeSlashOutline color="gray" className="icon" />
    }
  }

  const onNodeSelect = async ({
    element,
    isBranch,
  }: ITreeViewOnNodeSelectProps) => {
    if (!isBranch) {
      dispatch(setSelectedNode(element as TreeNode))
    }
  }

  // 탐색기 중 파일 외부를 클릭하면 루트 디렉토리를 클릭한 것과 같다.
  const onRootDirectoryClick = () => {
    // 이전에 select 상태였던 노드를 deselect한 것처럼 보여주기
    selectedTreeNodeRef.current?.classList.remove('tree-node--selected')
    dispatch(setSelectedNode({ ...selectedNode, parent: 1 }))
  }

  /** 디렉토리 생성 버튼 클릭 이벤트 핸들러 */
  // 새 디렉토리 이름을 받는 모달 창을 띄운다.
  const createDirectoryButtonClick = () => {
    if (!selectedNode.metadata?.isDirectory) {
      toast({
        title: '파일에 디렉토리를 생성할 수 없습니다.',
        position: 'top-right',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } else {
      setNewEntryType('directory')
      onOpen()
    }
  }

  // ** 파일 생성 버튼 클릭 이벤트 핸들러 */
  // 새 파일 이름을 받는 모달 창을 띄운다.
  const handleCreateFileButtonClick = () => {
    setNewEntryType('file')
    onOpen()
  }

  // ** 엔트리 생성 요청 핸들러 */
  const handleCreateEntry = async () => {
    // TODO - 수정
    const isDirectory = newEntryType === 'directory'

    const response = await createEntry(
      containerId!,
      selectedNode.parent === null ? 1 : selectedNode.parent,
      newEntryName,
      isDirectory
    )

    if (response.success && response.data) {
      const newEntries = response.data
      const newTree = flattenTree(newEntries)
      dispatch(setTree(newTree as Tree))

      toast({
        title: `${isDirectory ? '디렉토리가' : '파일이'} 생성되었습니다.`,
        position: 'top-right',
        colorScheme: 'green',
        duration: 3000,
        isClosable: true,
      })
    } else {
      toast({
        title: `${isDirectory ? '디렉토리' : '파일'} 생성 실패`,
        description: response.error,
        position: 'top-right',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  /** 엔트리 생성 모달 onClose */
  const modalClose = () => {
    onClose()
    setNewEntryName('')
  }

  // ** 마우스 우클릭 클릭 이벤트 핸들러 */
  // 메뉴 모달을 띄운다.
  const handleContextMenu = (e: any) => {
    e.preventDefault()
    setMenuPosition({ x: e.clientX, y: e.clientY })
    onMenuOpen()
  }

  //** 이름 수정 클릭 이벤트 핸들러 */
  // 이름 수정 모달을 띄운다.
  const handleEditEntryNameButtonClick = () => {
    setNewEntryName(
      tree!.find(node => node.id === contextClickElementId)?.name!
    )
    onEditNameModalOpen()
  }

  /** 엔트리 이름 수정 요청 핸들러 */
  const handleEditName = async () => {
    const editingEntry = tree!.find(node => node.id === contextClickElementId)

    if (editingEntry!.name === newEntryName) {
      onEditNameModalClose()
      return
    }

    const response = await editEntryName(
      containerId!,
      contextClickElementId,
      newEntryName,
      editingEntry?.metadata?.isDirectory!
    )

    if (response.success) {
      const newTree = tree?.map(node => {
        if (node.id === contextClickElementId) {
          return { ...node, name: newEntryName }
        }
        return node
      })!

      dispatch(setTree(newTree))
      onEditNameModalClose()
    } else {
      toast({
        title: `${editingEntry?.metadata?.isDirectory ? '디렉토리' : '파일'} 이름 수정 실패`,
        description: response.error,
        position: 'top-right',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  /** 엔트리 삭제 요청 핸들러 */
  const handleDeleteEntry = async () => {
    const response = await deleteEntry(containerId!, contextClickElementId)

    if (response.success) {
      const newTree = tree!.filter(
        node =>
          node.id !== contextClickElementId &&
          node.parent !== contextClickElementId
      )

      dispatch(setTree(newTree))
    } else {
      toast({
        title: '삭제 실패',
        description: response.error,
        position: 'top-right',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }

    onDeleteModalClose()
  }

  return (
    <>
      <Flex align="center">
        <Text fontSize="sm">탐색기</Text>
        <Spacer />
        <IconButton
          aria-label="add folder"
          size="xs"
          bgColor="transparent"
          icon={<FiFolderPlus />}
          fontSize="16px"
          onClick={createDirectoryButtonClick}
        />
        <IconButton
          aria-label="add files"
          size="xs"
          bgColor="transparent"
          icon={<FiFilePlus />}
          fontSize="16px"
          onClick={handleCreateFileButtonClick}
        />
      </Flex>
      <Flex className="directory" direction="column" minH="calc(100vh - 120px)">
        <TreeView
          data={tree!}
          aria-label="directory tree"
          onNodeSelect={onNodeSelect}
          defaultExpandedIds={[1]}
          defaultSelectedIds={[2]}
          nodeRenderer={({
            element,
            isBranch,
            isExpanded,
            getNodeProps,
            isSelected,
            level,
          }) => (
            <div
              {...getNodeProps()}
              style={{ paddingLeft: 20 * (level - 1) }}
              ref={isSelected ? selectedTreeNodeRef : null}
              onContextMenu={e => {
                handleContextMenu(e)
                setContextClickElementId(element.id as number)
              }}
            >
              {isBranch ? (
                <FolderIcon isOpen={isExpanded} />
              ) : (
                <FileIcon filename={element.name} />
              )}

              {element.name}
            </div>
          )}
        />
        <Box flexGrow={1} onClick={onRootDirectoryClick} />
      </Flex>

      {/* SECTION 디렉토리/파일 우클릭 시 나타나는 메뉴 */}
      <Menu isOpen={isMenuOpen} onClose={onMenuClose} isLazy>
        <MenuList
          style={{
            position: 'absolute',
            left: menuPosition.x,
            top: menuPosition.y,
          }}
          minW="120px"
        >
          <MenuItem fontSize="sm" onClick={handleEditEntryNameButtonClick}>
            이름 수정
          </MenuItem>
          <MenuItem fontSize="sm" onClick={onDeleteModalOpen}>
            삭제
          </MenuItem>
        </MenuList>
      </Menu>

      {/* SECTION 엔트리 생성 모달 */}
      <Modal
        isOpen={isOpen}
        onClose={modalClose}
        title="이름"
        cancelMessage="취소"
        confirmMessage="생성"
        confirmCallback={handleCreateEntry}
      >
        <Text fontWeight="bold" mb={1}>
          이름
        </Text>
        <Input
          placeholder={`생성할 ${newEntryType === 'file' ? '파일' : '디렉토리'}의 이름을 입력해주세요.`}
          size="sm"
          borderRadius="md"
          mb={4}
          value={newEntryName}
          onChange={e => setNewEntryName(e.target.value)}
          // TODO - 디렉토리이면 뒤에 확장자 없이, 파일이면 뒤에 확장자 필수 확인(유효성 검사 추가)
          isInvalid={newEntryName === ''}
        />
      </Modal>

      {/* SECTION 디렉토리/파일 이름 수정 모달 */}
      <Modal
        isOpen={isEditNameModalOpen}
        onClose={onEditNameModalClose}
        title="이름 수정"
        cancelMessage="취소"
        confirmMessage="수정"
        confirmCallback={handleEditName}
      >
        <Input
          size="sm"
          borderRadius="md"
          mb={4}
          value={newEntryName}
          onChange={e => setNewEntryName(e.target.value)}
          // TODO - 디렉토리이면 뒤에 확장자 없이, 파일이면 뒤에 확장자 필수 확인(유효성 검사 추가)
          isInvalid={newEntryName === ''}
        />
      </Modal>

      {/* SECTION 엔트리 삭제 확인 모달 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        title="정말로 삭제하시겠습니까?"
        cancelMessage="취소"
        confirmMessage="삭제"
        confirmCallback={handleDeleteEntry}
        confirmButtonColorScheme="red"
      ></Modal>
    </>
  )
}

export default Explorer
