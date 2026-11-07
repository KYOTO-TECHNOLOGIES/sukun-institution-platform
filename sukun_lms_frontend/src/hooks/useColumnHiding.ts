import { useState } from 'react';

const useColumnHiding = ({ oldValue,hiddenColumnArray,buttonArray }:any) => {
	const [columns] = useState(oldValue.map((data:any)=> ({...data,hidden: hiddenColumnArray.includes(data.field),
			hiddenByColumnsButton:false,
        })));


	return [...columns,...buttonArray];
};

export default useColumnHiding;