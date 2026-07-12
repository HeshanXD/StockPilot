export default function Card({title,value}){


return(

<div className="
bg-card
border
rounded-xl
p-6
shadow
">


<p className="text-muted">

{title}

</p>


<h2 className="text-3xl font-bold">

{value}

</h2>


</div>


)

}