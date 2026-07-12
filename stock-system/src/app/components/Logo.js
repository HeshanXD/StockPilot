import Image from "next/image";
import { company } from "../config/company";


export default function Logo(){

return (

<div className="flex items-center gap-3">


<Image

src={company.logo}

width={45}

height={45}

alt="Logo"

className="shrink-0 rounded-lg"

/>


<span

className="
opacity-0
group-hover:opacity-100
text-xl
font-bold
text-[var(--text)]
whitespace-nowrap
transition-opacity
duration-200
"

>

{company.name}

</span>


</div>

);

}