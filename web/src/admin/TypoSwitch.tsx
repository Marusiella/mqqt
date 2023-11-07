import {useEffect, useState} from "react";
import {Switch} from "@/components/ui/switch.tsx";

export const TypoSwitch = () => {
    const [isTypo, setIsTypo] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    useEffect(() => {
        const getData = async () => {
            const res = await fetch('/api/typotolerance')
            const data = await res.json()
            setIsTypo(data.enabled)
            setLoading(false)
        }
        getData()
    },[])
    useEffect(() => {
        const setTypo = async () => {
            let typ = false;
            setIsTypo(prev => {
                typ = prev
                return prev
            })
            setLoading(true)
            await fetch('/api/typotolerance', {
                method: 'POST',
                body: JSON.stringify({enabled: typ}),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            setLoading(false)
        }
        if (!loading) {
            setTypo()
        }
    }, [isTypo]);
    return (
        <>
            <div className="mt-8 flex">
                <Switch checked={isTypo} disabled={loading}  onCheckedChange={setIsTypo} /> <span className="ml-4">Change typo tolerance</span>
            </div>
        </>
    )
};