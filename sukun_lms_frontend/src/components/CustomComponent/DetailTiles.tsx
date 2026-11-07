const DetailsTile = ({ title, value, col ,isTimeSection=false}: any) => {
    return (
        <>
      <div className={`${col} ms-3 mb-4} style={{ paddingTop: '10px' }`}>
        <div className={`fw-bolder fs-6 truncate-line-1 mb-0 text-grey`}>{title}</div>
        <div className="text-muted fst-italic ">{value || 'No Data'}</div>

      </div>
      </>
    );
  };
  export default DetailsTile;