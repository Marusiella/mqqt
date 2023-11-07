import {Button} from "@/components/ui/button.tsx";
import {Link} from "react-router-dom";
import {Home} from "lucide-react";
import {TypoSwitch} from "@/admin/TypoSwitch.tsx";

export const Admin = () => {
    return (
        <main className="p-24 bg-neutral-100 w-full min-h-screen text-black">
            <div className="flex items-center">
                <Button asChild  variant="outline">
                    <Link to="/">
                        <Home/>
                    </Link>
                </Button>
                <h2 className="font-medium text-2xl ml-4">Settings panel</h2>

            </div>
            <div>
                <TypoSwitch/>
            </div>
        </main>
    )
}