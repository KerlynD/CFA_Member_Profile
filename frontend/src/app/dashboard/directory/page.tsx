import Image from "next/image";

export default function Directory() {
    return (
        <div className="flex flex-col p-2 w-full">
            <div className="flex flex-row w-full">
                <h1 className=" " >Directory</h1>
                <Image className="" src="/folder-svgrepo-com.svg" alt="" width={20} height={20} />
            </div>
            <div>

            </div>
        </div>
    );
}