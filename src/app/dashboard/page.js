"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrentStock } from "@/lib/stock";


export default function Dashboard(){

  const [totalProducts,setTotalProducts] = useState(0);
  const [totalStock,setTotalStock] = useState(0);
  const [todayProduction,setTodayProduction] = useState(0);
  const [todayDispatch,setTodayDispatch] = useState(0);

  const [lowStockItems,setLowStockItems] = useState([]);
  const [recentActivity,setRecentActivity] = useState([]);



async function loadDashboard(){


const {data:products,error}=await supabase
.from("products")
.select("*");


if(error){
console.log(error);
return;
}


setTotalProducts(products.length);


let stock=0;
let low=[];


for(const product of products){

const current=await getCurrentStock(product);

stock+=current;


if(product.minimum_stock && current <= product.minimum_stock){

low.push({
name:product.name,
stock:current
});

}

}


setTotalStock(stock);
setLowStockItems(low);



const today=new Date()
.toISOString()
.split("T")[0];



const {data:production}=await supabase
.from("production")
.select(`
id,
quantity,
created_at,
products(name)
`)
.order("created_at",{ascending:false});



const {data:dispatch}=await supabase
.from("dispatch")
.select(`
id,
quantity,
created_at,
products(name),
customers(name)
`)
.order("created_at",{ascending:false});



const todayProductionData =
production?.filter(x=>x.created_at.startsWith(today)) || [];


const todayDispatchData =
dispatch?.filter(x=>x.created_at.startsWith(today)) || [];



setTodayProduction(
todayProductionData.reduce(
(sum,x)=>sum+x.quantity,0
)
);



setTodayDispatch(
todayDispatchData.reduce(
(sum,x)=>sum+x.quantity,0
)
);




const activities=[


...(production||[]).map(item=>({

id:"p"+item.id,
type:"production",
text:`${item.quantity} units of ${item.products.name} produced`,
date:item.created_at

})),


...(dispatch||[]).map(item=>({

id:"d"+item.id,
type:"dispatch",
text:`${item.quantity} units of ${item.products.name} sent to ${item.customers.name}`,
date:item.created_at

}))


];


activities.sort(
(a,b)=>new Date(b.date)-new Date(a.date)
);


setRecentActivity(
activities.slice(0,8)
);


}



useEffect(()=>{
loadDashboard();
},[]);





return(

<main className="p-8 space-y-8">


<div>

<h1 className="text-4xl font-bold">
Dashboard
</h1>

<p className="text-[var(--muted)] mt-2">
Welcome back. Here is your business overview.
</p>

</div>





<div className="
grid 
gap-6
md:grid-cols-2
xl:grid-cols-4
">


<Card
title="Total Products"
value={totalProducts}
icon="📦"
/>


<Card
title="Current Stock"
value={totalStock}
icon="🏭"
/>


<Card
title="Today's Production"
value={`+${todayProduction}`}
icon="🟢"
/>


<Card
title="Today's Dispatch"
value={todayDispatch}
icon="🚚"
/>


</div>








<div className="grid xl:grid-cols-2 gap-8">



<section>

<h2 className="text-xl font-bold mb-4">
Stock Alerts
</h2>


<div className="
rounded-xl
border
bg-[var(--card)]
overflow-hidden
">


{
lowStockItems.length===0?

<div className="p-6 text-center">
✅ All stock levels are healthy
</div>


:

lowStockItems.map(item=>(

<div
key={item.name}
className="
p-5
border-b
flex
justify-between
"
>


<span>
⚠️ {item.name}
</span>


<span className="text-red-500 font-semibold">
{item.stock} left
</span>


</div>


))


}



</div>


</section>






<section>


<h2 className="text-xl font-bold mb-4">
Recent Activity
</h2>


<div className="
rounded-xl
border
bg-[var(--card)]
overflow-hidden
">


{
recentActivity.map(item=>(


<div
key={item.id}
className="
p-5
border-b
flex
gap-3
"
>


<div>

{
item.type==="production"
?
"🟢"
:
"🔴"
}

</div>


<div>

<p>
{item.text}
</p>


<p className="
text-sm
text-[var(--muted)]
">

{
new Date(item.date)
.toLocaleString()

}

</p>


</div>


</div>


))


}



</div>


</section>



</div>






</main>


);


}







function Card({title,value,icon}){

return(

<div
className="
rounded-2xl
border
bg-[var(--card)]
p-6
shadow-sm
hover:shadow-lg
transition
"
>


<div className="
flex
justify-between
items-center
"
>


<div>

<p className="text-[var(--muted)]">
{title}
</p>


<h2 className="
text-4xl
font-bold
mt-3
">

{value}

</h2>


</div>


<div className="
text-4xl
">

{icon}

</div>


</div>


</div>

)

}