import { useEffect } from "react"
import { useRouter } from "next/router"

export default function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const router = useRouter()

    useEffect(() => {
      const token = localStorage.getItem("jm_token")
      if (!token) {
        router.replace("/") // redirect ke login
      }
    }, [])

    return <Component {...props} />
  }
}
