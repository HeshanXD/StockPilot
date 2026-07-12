export default function Card({title,value}){


return (

<div

className="
rounded-xl
border
border-[var(--border)]
bg-[var(--card)]
p-6
shadow
"


>


<p className="text-[var(--muted)]">

{title}

</p>


<h2 className="mt-2 text-3xl font-bold text-[var(--text)]">

{value}

</h2>


</div>

);


}