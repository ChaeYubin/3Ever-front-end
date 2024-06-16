import { Link, useNavigate } from 'react-router-dom'
import {
  Button,
  Flex,
  FormControl,
  Image,
  Input,
  Text,
  Box,
  Divider,
  AbsoluteCenter,
} from '@chakra-ui/react'
import logo from '../../assets/images/logo.png'
import { useForm, SubmitHandler } from 'react-hook-form'
import { login } from '@/services/user'
import { useAppDispatch } from '@/hooks'
import { login as loginAction } from '@/store/userSlice'

interface LoginFormFields {
  username: string
  password: string
}

const LoginPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormFields>()

  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const onSubmit: SubmitHandler<LoginFormFields> = async data => {
    try {
      const response = await login(data.username, data.password)

      if (response.success) {
        const userInfo = response.data?.userInfo!
        dispatch(
          loginAction({
            id: userInfo.username,
            nickname: userInfo.nickname,
            profileUrl: userInfo.profileUrl,
          })
        )
        alert('로그인 성공')
        navigate('/container/my')
      }
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'message' in error) {
        alert((error as { message: string }).message)
        console.error('로그인 실패:', error)
      } else {
        alert('알 수 없는 오류가 발생했습니다.')
        console.error('로그인 실패:', error)
      }
    }
  }

  return (
    <>
      <Flex w="100%" h="100vh" bg="gray.50" align="center" justify="center">
        <Flex
          flexDir="column"
          bg="white"
          p={6}
          borderRadius={10}
          align="center"
          maxW="500px"
          w="full"
        >
          <Image src={logo} boxSize="150px" objectFit="contain" mb="20px" />
          <form onSubmit={handleSubmit(onSubmit)} style={{ width: '100%' }}>
            <FormControl>
              <Input
                {...register('username', { required: true })}
                type="text"
                placeholder="아이디"
                mb={3}
                focusBorderColor="green.400"
              />
              <Input
                {...register('password', { required: true })}
                type="password"
                placeholder="비밀번호"
                focusBorderColor="green.400"
              />
              {errors.username && (
                <Text color="red">아이디를 입력해주세요.</Text>
              )}
              {errors.password && (
                <Text color="red">비밀번호를 입력해주세요.</Text>
              )}
              <Button
                type="submit"
                w="full"
                bg="green.400"
                color="white"
                _hover={{ bg: 'green.500' }}
                variant="solid"
                my={4}
              >
                로그인
              </Button>
            </FormControl>
          </form>
          <Flex justify="space-between" w="100%">
            <Link to="/signup">
              <Text fontSize="small">회원가입 하러가기</Text>
            </Link>
            <Link to="">
              <Text fontSize="small">아이디 비밀번호 찾기</Text>
            </Link>
          </Flex>
          <Box pos="relative" py={12} width="100%">
            <Divider />
            <AbsoluteCenter bg="white" w="fit-content" p={4}>
              <Text color="gray.400" textAlign="center" fontSize="small">
                또는
              </Text>
            </AbsoluteCenter>
          </Box>
          <Flex flexDir="column" w="full" gap={3}>
            <a href="http://localhost:8080/api/oauth2/authorization/kakao">
              <Button bg="yellow.300" _hover={{ bg: 'yellow.400' }} w="full">
                카카오계정으로 로그인
              </Button>
            </a>
            <a href="http://localhost:8080/api/oauth2/authorization/naver">
              <Button
                bg="green.400"
                color="white"
                _hover={{ bg: 'green.500' }}
                w="full"
              >
                네이버로 로그인
              </Button>
            </a>
            <a href="http://localhost:8080/api/oauth2/authorization/google">
              <Button colorScheme="gray" w="full">
                구글로 로그인
              </Button>
            </a>
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}

export default LoginPage
