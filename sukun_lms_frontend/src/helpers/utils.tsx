import moment from "moment";
import swalFire from "./swalHelper";



export const showConfirmationDialog = (title, text, html, icon, confirmButtonText, isRemarksRequired = false) => {
  const config: any = {
    title,
    text,
    html,
    icon,
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText
  };

  // Add input field if remarks are required
  if (isRemarksRequired) {
    config.input = 'textarea';
    config.inputPlaceholder = 'Enter your remarks here...';
    config.inputAttributes = {
      'aria-label': 'Enter your remarks',
      'rows': 4
    };
    config.inputValidator = (value) => {
      if (!value || value.trim() === '') {
        return 'Remarks are required!';
      }
    };
  }

  return swalFire(config);
};

export const initializeLocalStorageValues = () => {
  // @ts-ignore
  const tempValue = JSON.parse(localStorage.getItem('columnHiddenOnIntitalLoad'));
  if (tempValue) return;

  // @ts-ignore
  localStorage.setItem('columnHiddenOnIntitalLoad', true);
  localStorage.setItem('gtccManagementList', JSON.stringify(["foodwatch_id", "foodwatch_business_id"]));
  localStorage.setItem('entityManagement', JSON.stringify(["foodwatch_id", "foodwatch_business_id"]));
  localStorage.setItem('activeList', JSON.stringify(["entity__foodwatch_id"]));
  localStorage.setItem('approvalPending', JSON.stringify(["entity__foodwatch_id"]));
  localStorage.setItem('expiredList', JSON.stringify(["entity__foodwatch_id"]));
  localStorage.setItem('rejectedList', JSON.stringify(["entity__foodwatch_id"]));
  localStorage.setItem('gtccDetailDischargeList', JSON.stringify(["entity_foodwatch_id", "foodwatch_srid"]));
  localStorage.setItem('serviceRequestGtcc', JSON.stringify(["entity_foodwatch_id", "foodwatch_srid"]));
  localStorage.setItem('entityGreaseTrapList', JSON.stringify(["foodwatch_id"]));
  localStorage.setItem('entityServiceRequestList', JSON.stringify(["entity_foodwatch_id", "foodwatch_srid"]));
  localStorage.setItem('entityServiceRequest', JSON.stringify(["entity_foodwatch_id", "foodwatch_srid"]));
  localStorage.setItem('manageGreaseTraps', JSON.stringify(["foodwatch_grease_trap_id"]));
  localStorage.setItem('zoneList', JSON.stringify(["foodwatch_id", "foodwatch_name"]));
  localStorage.setItem('greaseTrapPage', JSON.stringify(["foodwatch_id"]));
  localStorage.setItem('restrauntCategoryPage', JSON.stringify(["foodwatch_id", "foodwatch_name"]));
  localStorage.setItem('allServiceRequest', JSON.stringify(["foodwatch_srid", "entity_foodwatch_id"]));
};


export const updateHiddenColumnsInLocalStorage = (column, hidden, hiddenColumnsKey) => {
  // const hiddenColumnsKey = 'invitationHiddenColumns'; // Key for localStorage
  // @ts-ignore
  let hiddenColumns = JSON.parse(localStorage.getItem(hiddenColumnsKey)) || [];

  if (hidden) {
    // Add to hiddenColumns if not already present
    if (!hiddenColumns.includes(column.field)) {
      hiddenColumns.push(column.field);
    }
  } else {
    // Remove from hiddenColumns if present
    hiddenColumns = hiddenColumns.filter((field) => field !== column.field);
  }

  // Update localStorage
  localStorage.setItem(hiddenColumnsKey, JSON.stringify(hiddenColumns));
}

// export const isColoumnRemovable = (domain) => {
//   return domain === 'Dubai'
// }

export function generateQueryParams(query, isCustom = false) {
  let orderBy = "";
  let otherFilters = "";
  query.filters.forEach(item => {
    if (item.column.field === 'created_date__date') {
      otherFilters += `&${item.column.field}=${moment(item.value).format("YYYY-MM-DD")}`;
    } else if (item.column.field === 'exclude_vat_intercompany' && item.value.length === 1) {
      otherFilters += `&${item.column.field}=${item.value[0]}`;
    } else if (item.column.field === 'exclude_vat_intercompany' && item.value.length === 2) {
      otherFilters += '';

    }
    else {
      if (isCustom) {
        otherFilters += `&${item.column.field}__icontains=${item.value}`;
      } else {
        otherFilters += `&${item.column.field}=${item.value}`;
      }
    }
  });

  if (query.orderByCollection && query.orderByCollection.length > 0 && query.orderByCollection.length === 1) {
    const orderConfig = query.orderByCollection[0];
    orderBy = orderConfig.orderDirection === "asc"
      ? `&ordering=-${orderConfig.orderByField}`
      : `&ordering=${orderConfig.orderByField}`;
  }

  return `${orderBy}${otherFilters}`
}

function base64ToBlob(base64String, contentType = '') {
  const sliceSize = 512;
  const byteCharacters = window.atob(base64String);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    // @ts-ignore
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}

export function base64ToFile(base64String, fileName) {
  const [metadata, data] = base64String.split(',');
  const mimeType = metadata.match(/:(.*?);/)[1];

  // Convert base64 string to Blob
  const blob = base64ToBlob(data, mimeType);

  // Create File object
  return new File([blob], fileName, { type: mimeType });
}


// Function to update column order
// export const updateColumnOrder = (sourceIndex, destinationIndex,columns,storageKey,setColumns) => {
//     const updatedColumns = [...columns];
//     const [movedColumn] = updatedColumns.splice(sourceIndex, 1);
//     updatedColumns.splice(destinationIndex, 0, movedColumn);

//     setColumns(updatedColumns);

//     // Store only field names in order
//     const newOrder = updatedColumns.map((col) => col.field);
//     localStorage.setItem(`${storageKey}Order`, JSON.stringify(newOrder));
//   };
export const updateColumnOrder = (
  sourceIndex,
  destinationIndex,
  columns,
  storageKey,
  setColumns
) => {
  const allColumns = [...columns]; // Work on the full column list

  // Find the actual source and destination positions, skipping hidden columns
  const visibleColumns = allColumns.filter((col) => !col.hidden);
  const sourceField = visibleColumns[sourceIndex]?.field;
  if (!sourceField) return; // If source field is invalid, do nothing

  let adjustedDestinationIndex = destinationIndex;

  // Find the nearest visible column position for destination
  while (
    adjustedDestinationIndex >= 0 &&
    adjustedDestinationIndex < allColumns.length &&
    allColumns[adjustedDestinationIndex].hidden
  ) {
    adjustedDestinationIndex += destinationIndex > sourceIndex ? 1 : -1;
  }

  // Ensure the destination index is valid
  if (adjustedDestinationIndex < 0 || adjustedDestinationIndex >= allColumns.length) return;

  // Reconstruct the column list while maintaining order
  const updatedColumns = [...allColumns];

  // Find actual indexes in full columns array
  const actualSourceIndex = updatedColumns.findIndex((col) => col.field === sourceField);
  const [movedColumn] = updatedColumns.splice(actualSourceIndex, 1);
  updatedColumns.splice(adjustedDestinationIndex, 0, movedColumn);


  setColumns(updatedColumns);

  // Store new column order in localStorage
  const newOrder = updatedColumns.map((col) => col.field);
  localStorage.setItem(`${storageKey}Order`, JSON.stringify(newOrder));
};