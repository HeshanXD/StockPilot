export default function Badge({
status
}){


const styles={

good:
"bg-green-100 text-green-700",

low:
"bg-yellow-100 text-yellow-700",

critical:
"bg-red-100 text-red-700"

};


return (

<span

className={`
px-3
py-1
rounded-full
text-sm
font-medium

${styles[status] || styles.good}

`}

>

{status}

</span>

);


}