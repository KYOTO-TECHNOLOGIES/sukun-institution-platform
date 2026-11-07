import {Resource,field,relation,select} from './resourceTypes';
export const financeResources:Record<string,Resource>={
    'fee-catalog':{title:'Fee structures',subtitle:'Define tuition and charges for each class and academic year.',endpoint:'/api/finance/fee-structures/',permission:'finance',icon:'RequestQuote',institution:true,
        fields:[field('fee_name','Fee name','text',true),select('fee_type','Fee type',['TUITION','ADMISSION','EXAM','LIBRARY','SPORTS','TRANSPORT','OTHER']),relation('class_obj','Class','/api/academics/classes/','name',true),relation('academic_year','Academic year','/api/institutions/academic-years/','name',true),{...field('amount','Amount','number',true),min:0.01,step:'0.01'},{...field('due_days','Days until due','number'),min:0,default:7},{...field('is_mandatory','Automatically assign to enrolled students','checkbox'),default:true}],
        columns:['fee_name','class_name','academic_year_name','amount','is_mandatory']},
    'student-bills':{title:'Student fee ledger',subtitle:'Track billed amounts, collections, and balances for every student.',endpoint:'/api/finance/student-fees/',permission:'finance',icon:'AccountBalance',
        fields:[relation('student','Student','/api/students/students/','full_name',true),relation('fee_structure','Fee structure','/api/finance/fee-structures/','fee_name',true),relation('academic_year','Academic year','/api/institutions/academic-years/','name',true),{...field('total_amount','Billed amount','number',true),min:0,step:'0.01'},field('due_date','Due date','date')],
        columns:['student_name','fee_name','total_amount','amount_paid','balance','due_date','status']},
    receipts:{title:'Collections & receipts',subtitle:'Record payments and print receipts. Recorded payments remain in the ledger.',endpoint:'/api/finance/fee-payments/',permission:'finance',icon:'ReceiptLong',noDelete:true,noEdit:true,
        fields:[relation('student_fee','Student bill','/api/finance/student-fees/','student_name',true),{...field('amount','Payment amount','number',true),min:0.01,step:'0.01'},field('payment_date','Payment time','datetime-local',true),select('payment_method','Method',['CASH','UPI','ONLINE','CHEQUE']),field('transaction_id','Bank / transaction reference'),field('remarks','Remarks','textarea')],
        columns:['receipt_number','student_name','fee_name','amount','payment_method','payment_date','refunded_amount'],
        actions:[{label:'Print receipt',endpoint:'',link:(row:any)=>'/api/finance/fee-payments/'+row.id+'/receipt/'}]},
    refunds:{title:'Refund register',subtitle:'Record a reason for each refund and keep balances reconciled.',endpoint:'/api/finance/refunds/',permission:'finance',icon:'CurrencyExchange',noDelete:true,noEdit:true,
        fields:[relation('payment','Original receipt','/api/finance/fee-payments/','receipt_number',true),{...field('amount','Refund amount','number',true),min:0.01,step:'0.01'},field('reason','Reason','textarea',true),field('reference','Refund reference')],
        columns:['receipt_number','amount','reason','reference','created_at']},
    books:{title:'Library catalog',subtitle:'Organize books and track available copies.',endpoint:'/api/library/library-books/',permission:'library',icon:'LocalLibrary',institution:true,
        fields:[field('book_id','Accession number','text',true),field('title','Book title','text',true),field('author','Author','text',true),select('category','Category',['GENERAL','REFERENCE','LANGUAGE','ISLAMIC','QURAN','HADITH','FIQH','ARABIC']),field('isbn','ISBN'),field('publisher','Publisher'),{...field('total_copies','Total copies','number'),min:0,default:1},field('location_shelf','Shelf')],
        columns:['book_id','title','author','total_copies','available_copies','location_shelf']},
    loans:{title:'Library loans',subtitle:'Issue and return books with live stock checks.',endpoint:'/api/library/book-issues/',permission:'library',icon:'Book',noDelete:true,noEdit:true,
        fields:[relation('book','Book','/api/library/library-books/','title',true),relation('borrower','Borrower','/api/accounts/directory/','full_name',true),field('issue_date','Issue date','date',true),field('due_date','Return due','date',true)],
        columns:['book_title','borrower_name','issue_date','due_date','return_date','status'],actions:[{label:'Return book',endpoint:'return/',visible:row=>row.status!=='RETURNED'}]}
};
