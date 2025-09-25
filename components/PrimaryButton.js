// components/PrimaryButton.js
import { Button } from "@mui/material"

export default function PrimaryButton({
  children,
  loading = false,
  sx = {},
  ...props
}) {
  return (
    <Button
      variant="contained"
      disabled={loading}
      fullWidth={false} // bisa override pakai props
      sx={{
        borderRadius: "8px",
        textTransform: "capitalize", // biar nggak auto uppercase
        fontWeight: 600,
        backgroundColor: '#054493',
        ...sx, // supaya bisa override kalau perlu
      }}
      {...props}
    >
      {loading ? "Loading..." : children}
    </Button>
  )
}
