import { AddIcon, Search2Icon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  useDisclosure,
  Text,
  Select,
  Textarea,
  Flex,
  Spacer,
} from '@chakra-ui/react'
import Modal from '@/components/Modal'
import ContainerItem from './ContainerItem'
import { useEffect, useState } from 'react'
import { createContainer, getContainer } from '@/services/container'
import { Container } from '@/models/container'

interface Props {
  category: string
}

const ContainerList = ({ category }: Props) => {
  const [containerList, setContainerList] = useState<Container[] | null>(null)

  useEffect(() => {
    const CATEGORY: { [key: string]: string } = {
      '내 컨테이너': 'MY',
      '강의 컨테이너': 'LECTURE',
      '질문 컨테이너': 'QUESTION',
    }

    const getContainerList = async () => {
      const response = await getContainer(CATEGORY[category])

      if (response.success) {
        setContainerList(response.data?.result || [])
      } else {
        console.error('Error fetching containers:', response.error)
      }
    }

    getContainerList()
  }, [category])

  const { isOpen, onOpen, onClose } = useDisclosure()

  // NOTE - 컨테이너 생성 모달에서 사용할 변수들
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')

  const [showNameRequired, setShowNameRequired] = useState(false)
  const [showLanguageRequired, setShowLanguageRequired] = useState(false)

  const initiateValues = () => {
    setName('')
    setDescription('')
    setSelectedLanguage('')
    setShowNameRequired(false)
    setShowLanguageRequired(false)
  }

  const createButtonClick = async () => {
    if (name === '' || selectedLanguage === '') {
      if (name === '') {
        setShowNameRequired(true)
      }

      if (selectedLanguage === '') {
        setShowLanguageRequired(true)
      }
    } else {
      const response = await createContainer(
        name,
        description,
        selectedLanguage
      )

      if (response.success) {
        onClose()
      } else {
        console.log(response.error)
      }

      // 변수 초기화
      initiateValues()
    }
  }

  const modalClose = () => {
    initiateValues()
    onClose()
  }

  return (
    <>
      <Box p={5}>
        <Heading size="lg" mt={16}>
          {category}
        </Heading>
        <Box mt={5}>
          {/* NOTE - 컨테이너 생성 버튼은 '내 컨테이너'에서만 보인다. */}
          {category === '내 컨테이너' ? (
            <Button
              leftIcon={<AddIcon />}
              colorScheme="green"
              variant="solid"
              size="sm"
              onClick={onOpen}
            >
              새로운 컨테이너
            </Button>
          ) : (
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Search2Icon color="gray.300" />
              </InputLeftElement>
              <Input
                type="string"
                placeholder="검색"
                size="sm"
                focusBorderColor="green.400"
                bg="white"
                borderRadius="md"
                w="200px"
              />
            </InputGroup>
          )}
        </Box>

        {/* SECTION - 컨테이너 리스트 */}
        <Box mt={5}>
          <SimpleGrid
            spacing={4}
            templateColumns="repeat(auto-fill, minmax(250px, 1fr))"
          >
            {category === '내 컨테이너'
              ? containerList?.map(container => (
                  <ContainerItem
                    key={container.id}
                    category={category}
                    id={container.id}
                    title={container.title}
                    language={container.language}
                    description={container.description}
                  />
                ))
              : containerList?.map(container => (
                  <ContainerItem
                    key={container.id}
                    category={category}
                    id={container.id}
                    title={container.title}
                    language={container.language}
                    description={container.description}
                    nickname={container.nickname}
                    profileUrl={container.profileUrl}
                  />
                ))}
          </SimpleGrid>
        </Box>
      </Box>

      {/* 컨테이너 생성 모달 */}
      <Modal
        isOpen={isOpen}
        onClose={modalClose}
        title="컨테이너 생성하기"
        cancelMessage="취소"
        confirmMessage="생성"
        confirmCallback={createButtonClick}
      >
        <Text fontWeight="bold" mb={1}>
          이름
        </Text>
        <Input
          placeholder="컨테이너 이름을 입력해주세요."
          size="sm"
          borderRadius="md"
          mb={4}
          value={name}
          onChange={e => setName(e.target.value)}
          isInvalid={showNameRequired}
        />
        <Flex align="center">
          <Text mb={1}>
            <b>설명</b>(선택)
          </Text>
          <Spacer />
          <Text fontSize="sm" color="gray">
            {description.length < 60 ? description.length : 60}
            /60 자
          </Text>
        </Flex>
        <Textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="컨테이너 설명을 입력해주세요."
          size="sm"
          borderRadius="md"
          mb={4}
          resize="none"
          maxLength={60}
        />
        <Text mb={1}>
          <b>언어</b>(선택하신 언어로 기본 템플릿이 생성됩니다.)
        </Text>
        <Select
          placeholder="언어를 선택하세요."
          size="sm"
          borderRadius="md"
          value={selectedLanguage}
          onChange={e => setSelectedLanguage(e.target.value)}
          isInvalid={showLanguageRequired}
        >
          <option value="C">C</option>
          <option value="CPP">C++</option>
          <option value="JAVA">Java</option>
          <option value="JAVASCRIPT">JavaScript</option>
          <option value="PYTHON">Python</option>
        </Select>
      </Modal>
    </>
  )
}

export default ContainerList
