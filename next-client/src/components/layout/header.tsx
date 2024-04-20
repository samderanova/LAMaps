import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Ham, User } from "lucide-react";
import { ThemeToggle } from "../theme/toggle";
import { getSession } from "@auth0/nextjs-auth0";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        {session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="btn btn-ghost btn-circle">
                <User />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              Hello, {JSON.stringify(session.user, null, 2)}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <a href="/auth/login" className="btn btn-primary btn-sm">
            Login
          </a>
        )}
      </div>
    </div>
  );
}
