import { useState } from "react"
import { useRouter } from "next/router"
import {
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  Container,
  IconButton,
  InputAdornment,
} from "@mui/material"
import { api } from "../lib/apiClient"
import PrimaryButton from "../components/PrimaryButton"

export default function Login() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await api.login({ username, password })
      if (res?.token) {
        localStorage.setItem("jm_token", res.token)
        router.push("/dashboard")
      } else {
        setError("Login gagal — periksa kredensial")
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Left: Login Form */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 4,
        }}
      >
        <Container maxWidth="xs">
          <Box textAlign="center" mb={3}>
            <img src="/assets/logo-app.png" alt="App Logo" style={{ width: '80%' }} />
          </Box>

          <Paper elevation={0}>
            <form onSubmit={handleSubmit}>
              <Typography variant="h6">
                Username
              </Typography>
              <TextField
                variant="outlined"
                sx={{ mt: 0 }}
                fullWidth
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

              <Typography variant="h6" sx={{ mt:2 }}>
                Password
              </Typography>
              <TextField
                variant="outlined"
                type={showPassword ? "text" : "password"}
                fullWidth
                sx={{ mt: 0 }}
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={() => setShowPassword((prev) => !prev)}
                        style={{ fontSize: 18}}
                      >
                        { showPassword ? 'hide' : 'show'}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {error && (
                <Typography color="error" variant="body2" mt={1}>
                  {error}
                </Typography>
              )}
              <div className="text-right">
              <PrimaryButton
                type="submit"
                loading={loading}
                sx= {{ mt: 2, padding: '5px 25px' }}
              >
                Login
              </PrimaryButton>
              </div>
            </form>
          </Paper>
        </Container>
      </Box>

      {/* Right: Image */}
      <Box
        sx={{
          flex: 1,
          backgroundImage: "url(/assets/road-login.jpeg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: { xs: "none", md: "block" }, // hide di mobile
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        />
      </Box>
    </Box>
  )
}
