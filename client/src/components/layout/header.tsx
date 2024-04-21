import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Ham, LogOut, User } from "lucide-react";
import { ThemeToggle } from "../theme/toggle";
import { getSession } from "@auth0/nextjs-auth0";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { parseSession } from "@/lib/auth";

const headerNavLinks = [
  {
    label: "Demo",
    href: "/#demo",
  },
  {
    label: "About",
    href: "/#about",
  },
  {
    label: "Contact",
    href: "/#contact",
  },
];

export async function Header() {
  const session = await getSession();

  const user = parseSession(session);

  return (
    <div className="navbar bg-base-100">
      <div className="navbar-start">
        <Sheet>
          <SheetTrigger asChild>
            <button className="btn btn-ghost flex md:hidden">
              <Ham />
            </button>
          </SheetTrigger>

          <SheetContent side="left">
            <ul className="menu">
              {headerNavLinks.map((link) => {
                return (
                  <li key={link.href}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                );
              })}
            </ul>
          </SheetContent>
        </Sheet>

        <a className="btn btn-ghost text-xl">LAMaps</a>
      </div>

      <div className="navbar-center hidden md:flex">
        <ul className="menu menu-horizontal px-1">
          {headerNavLinks.map((link) => {
            return (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="navbar-end">
        <ThemeToggle />
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="btn btn-ghost btn-circle">
                <Avatar>
                  <AvatarImage src={user.picture} alt={user.name} />
                  <AvatarFallback>
                    <User />
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              <DropdownMenuLabel className="truncate max-w-40">
                {user.name}
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <a href="/api/auth/logout" className="space-x-2">
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <a href="/api/auth/login" className="btn btn-primary btn-sm">
            Login
          </a>
        )}
      </div>
    </div>
  );
}
