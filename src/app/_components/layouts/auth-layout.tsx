import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AuthLayoutProps = {
  className?: string;
  children: React.ReactNode;
  title: string;
  description?: string;
} & React.ComponentProps<"div">;

export default function AuthLayout({
  className,
  children,
  title,
  description,
  ...props
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>
                {description ?? "Please enter your credentials to continue."}
              </CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
