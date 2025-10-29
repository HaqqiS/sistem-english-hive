import { useState } from "react";
import { Eye, EyeClosed } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function InputPassword({ ...props }) {
  const [showPassword, setShowPassword] = useState(false);

  const handleOnclick = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative">
      <Input
        id="password"
        type={showPassword ? "text" : "password"}
        name="password"
        placeholder="••••••••"
        required
        {...props}
      />
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
        onClick={handleOnclick}
        tabIndex={-1}
      >
        {showPassword ? (
          <Eye className="h-5 w-5" />
        ) : (
          <EyeClosed className="h-5 w-5" />
        )}
        <span className="sr-only">
          {showPassword ? "Hide password" : "Show password"}
        </span>
      </button>
    </div>
  );
}
