import React, { useState } from 'react';
import SubHeader, { SubHeaderLeft, SubHeaderRight } from '../../../layout/SubHeader/SubHeader';
import Breadcrumb from '../../../components/bootstrap/Breadcrumb';
import Page from '../../../layout/Page/Page';
import PageWrapper from '../../../layout/PageWrapper/PageWrapper';
import Card, {
	CardActions,
	CardBody,
	CardCodeView,
	CardFooter,
	CardHeader,
	CardLabel,
	CardSubTitle,
	CardTitle,
} from '../../../components/bootstrap/Card';
import Button from '../../../components/bootstrap/Button';
import Icon from '../../../components/icon/Icon';
import CommonDesc from '../../../common/other/CommonDesc';
import CommonHowToUse from '../../../common/other/CommonHowToUse';
import OffCanvas, {
	OffCanvasBody,
	OffCanvasHeader,
	OffCanvasTitle,
} from '../../../components/bootstrap/OffCanvas';
import Alert from '../../../components/bootstrap/Alert';
import CommonStoryBtn from '../../../common/other/CommonStoryBtn';
import { TOffCanvasPlacement } from '../../../type/offCanvas-type';

const OffCanvasPage = () => {
	const [offcanvasStatus, setOffcanvasStatus] = useState(false);

	const [backdropStatus, setBackdropStatus] = useState(true);
	const [bodyScrollStatus, setBodyScrollStatus] = useState(false);
	const [placement, setPlacement] = useState<TOffCanvasPlacement>('end');

	const [headerClose, setHeaderClose] = useState(true);
	const componentPagesMenu = {
		bootstrap: {
			id: 'bootstrap',
			text: 'Bootstrap',
			icon: 'Extension',
		},
		components: {
			id: 'components',
			text: 'Component',
			path: 'components',
			icon: 'Extension',
			notification: 'success',
			subMenu: {
				accordion: {
					id: 'accordion',
					text: 'Accordion',
					path: 'components/accordion',
					icon: 'ViewDay',
				},
				alert: {
					id: 'alert',
					text: 'Alert',
					path: 'components/alert',
					icon: 'Announcement',
				},
				badge: {
					id: 'badge',
					text: 'Badge',
					path: 'components/badge',
					icon: 'Vibration',
				},
				breadcrumb: {
					id: 'breadcrumb',
					text: 'Breadcrumb',
					path: 'components/breadcrumb',
					icon: 'AddRoad',
				},
				button: {
					id: 'button',
					text: 'Button',
					path: 'components/button',
					icon: 'SmartButton',
				},
				buttonGroup: {
					id: 'buttonGroup',
					text: 'Button Group',
					path: 'components/button-group',
					icon: 'Splitscreen',
				},
				card: {
					id: 'card',
					text: 'Card',
					path: 'components/card',
					icon: 'Crop32',
				},
				carousel: {
					id: 'carousel',
					text: 'Carousel',
					path: 'components/carousel',
					icon: 'RecentActors',
				},
				// Close
				collapse: {
					id: 'collapse',
					text: 'Collapse',
					path: 'components/collapse',
					icon: 'UnfoldLess',
				},
				dropdowns: {
					id: 'dropdowns',
					text: 'Dropdowns',
					path: 'components/dropdowns',
					icon: 'Inventory',
				},
				listGroup: {
					id: 'listGroup',
					text: 'List Group',
					path: 'components/list-group',
					icon: 'ListAlt',
				},
				modal: {
					id: 'modal',
					text: 'Modal',
					path: 'components/modal',
					icon: 'PictureInPicture',
				},
				navsTabs: {
					id: 'navsTabs',
					text: 'Navs & Tabs',
					path: 'components/navs-and-tabs',
					icon: 'PivotTableChart',
				},
				// Navbar
				offcanvas: {
					id: 'offcanvas',
					text: 'Offcanvas',
					path: 'components/offcanvas',
					icon: 'VerticalSplit',
				},
				pagination: {
					id: 'pagination',
					text: 'Pagination',
					path: 'components/pagination',
					icon: 'Money',
				},
				popovers: {
					id: 'popovers',
					text: 'Popovers',
					path: 'components/popovers',
					icon: 'Assistant',
				},
				progress: {
					id: 'progress',
					text: 'Progress',
					path: 'components/progress',
					icon: 'HourglassTop',
				},
				scrollspy: {
					id: 'scrollspy',
					text: 'Scrollspy',
					path: 'components/scrollspy',
					icon: 'KeyboardHide',
				},
				spinners: {
					id: 'spinners',
					text: 'Spinners',
					path: 'components/spinners',
					icon: 'RotateRight',
				},
				table: {
					id: 'table',
					text: 'Table',
					path: 'components/table',
					icon: 'TableChart',
				},
				toasts: {
					id: 'toasts',
					text: 'Toasts',
					path: 'components/toasts',
					icon: 'RotateRight',
				},
				tooltip: {
					id: 'tooltip',
					text: 'Tooltip',
					path: 'components/tooltip',
					icon: 'Assistant',
				},
			},
		},
		forms: {
			id: 'forms',
			text: 'Forms',
			path: 'forms',
			icon: 'CheckBox',
			notification: 'success',
			subMenu: {
				formGroup: {
					id: 'formGroup',
					text: 'Form Group',
					path: 'forms/form-group',
					icon: 'Source',
				},
				formControl: {
					id: 'formControl',
					text: 'Form Controls',
					path: 'forms/form-controls',
					icon: 'Create',
				},
				select: {
					id: 'select',
					text: 'Select',
					path: 'forms/select',
					icon: 'Checklist',
				},
				checksAndRadio: {
					id: 'checksAndRadio',
					text: 'Checks & Radio',
					path: 'forms/checks-and-radio',
					icon: 'CheckBox',
				},
				range: {
					id: 'range',
					text: 'Range',
					path: 'forms/range',
					icon: 'HdrStrong',
				},
				inputGroup: {
					id: 'inputGroup',
					text: 'Input Group',
					path: 'forms/input-group',
					icon: 'PowerInput',
				},
				validation: {
					id: 'validation',
					text: 'Validation',
					path: 'forms/validation',
					icon: 'VerifiedUser',
				},
				wizard: {
					id: 'wizard',
					text: 'Wizard',
					path: 'forms/wizard',
					icon: 'LinearScale',
				},
			},
		},
		content: {
			id: 'content',
			text: 'Content',
			path: 'content',
			icon: 'format_size',
			subMenu: {
				typography: {
					id: 'typography',
					text: 'Typography',
					path: 'content/typography',
					icon: 'text_fields',
				},
				images: {
					id: 'images',
					text: 'Images',
					path: 'content/images',
					icon: 'Image ',
				},
				tables: {
					id: 'tables',
					text: 'Tables',
					path: 'content/tables',
					icon: 'table_chart',
				},
				figures: {
					id: 'figures',
					text: 'Figures',
					path: 'content/figures',
					icon: 'Photo Library ',
				},
			},
		},
		utilities: {
			id: 'utilities',
			text: 'Utilities',
			path: 'utilities',
			icon: 'Support',
			subMenu: {
				api: {
					id: 'api',
					text: 'API',
					path: 'utilities/api',
					icon: 'Api',
				},
				background: {
					id: 'background',
					text: 'Background',
					path: 'utilities/background',
					icon: 'FormatColorFill',
				},
				borders: {
					id: 'borders',
					text: 'Borders',
					path: 'utilities/borders',
					icon: 'BorderStyle',
				},
				colors: {
					id: 'colors',
					text: 'Colors',
					path: 'utilities/colors',
					icon: 'InvertColors',
				},
				display: {
					id: 'display',
					text: 'Display',
					path: 'utilities/display',
					icon: 'LaptopMac',
				},
				flex: {
					id: 'flex',
					text: 'Flex',
					path: 'utilities/flex',
					icon: 'SettingsOverscan',
				},
				float: {
					id: 'float',
					text: 'Float',
					path: 'utilities/float',
					icon: 'ViewArray',
				},
				interactions: {
					id: 'interactions',
					text: 'Interactions',
					path: 'utilities/interactions',
					icon: 'Mouse',
				},
				overflow: {
					id: 'overflow',
					text: 'Overflow',
					path: 'utilities/overflow',
					icon: 'TableRows',
				},
				position: {
					id: 'position',
					text: 'Position',
					path: 'utilities/position',
					icon: 'Adjust',
				},
				shadows: {
					id: 'shadows',
					text: 'Shadows',
					path: 'utilities/shadows',
					icon: 'ContentCopy',
				},
				sizing: {
					id: 'sizing',
					text: 'Sizing',
					path: 'utilities/sizing',
					icon: 'Straighten',
				},
				spacing: {
					id: 'spacing',
					text: 'Spacing',
					path: 'utilities/spacing',
					icon: 'SpaceBar',
				},
				text: {
					id: 'text',
					text: 'Text',
					path: 'utilities/text',
					icon: 'TextFields',
				},
				verticalAlign: {
					id: 'vertical-align',
					text: 'Vertical Align',
					path: 'utilities/vertical-align',
					icon: 'VerticalAlignCenter',
				},
				visibility: {
					id: 'visibility',
					text: 'Visibility',
					path: 'utilities/visibility',
					icon: 'Visibility',
				},
			},
		},
		extra: {
			id: 'extra',
			text: 'Extra Library',
			icon: 'Extension',
			path: undefined,
		},
		icons: {
			id: 'icons',
			text: 'Icons',
			path: 'icons',
			icon: 'Grain',
			notification: 'success',
			subMenu: {
				icon: {
					id: 'icon',
					text: 'Icon',
					path: 'icons/icon',
					icon: 'Lightbulb',
				},
				material: {
					id: 'material',
					text: 'Material',
					path: 'icons/material',
					icon: 'Verified',
				},
			},
		},
		charts: {
			id: 'charts',
			text: 'Charts',
			path: 'charts',
			icon: 'AreaChart',
			notification: 'success',
			subMenu: {
				chartsUsage: {
					id: 'chartsUsage',
					text: 'General Usage',
					path: 'charts/general-usage',
					icon: 'Description',
				},
				chartsSparkline: {
					id: 'chartsSparkline',
					text: 'Sparkline',
					path: 'charts/sparkline',
					icon: 'AddChart',
				},
				chartsLine: {
					id: 'chartsLine',
					text: 'Line',
					path: 'charts/line',
					icon: 'ShowChart',
				},
				chartsArea: {
					id: 'chartsArea',
					text: 'Area',
					path: 'charts/area',
					icon: 'AreaChart',
				},
				chartsColumn: {
					id: 'chartsColumn',
					text: 'Column',
					path: 'charts/column',
					icon: 'BarChart',
				},
				chartsBar: {
					id: 'chartsBar',
					text: 'Bar',
					path: 'charts/bar',
					icon: 'StackedBarChart',
				},
				chartsMixed: {
					id: 'chartsMixed',
					text: 'Mixed',
					path: 'charts/mixed',
					icon: 'MultilineChart',
				},
				chartsTimeline: {
					id: 'chartsTimeline',
					text: 'Timeline',
					path: 'charts/timeline',
					icon: 'WaterfallChart',
				},
				chartsCandleStick: {
					id: 'chartsCandleStick',
					text: 'Candlestick',
					path: 'charts/candlestick',
					icon: 'Cake',
				},
				chartsBoxWhisker: {
					id: 'chartsBoxWhisker',
					text: 'Box Whisker',
					path: 'charts/box-whisker',
					icon: 'SportsMma',
				},
				chartsPieDonut: {
					id: 'chartsPieDonut',
					text: 'Pie & Donut',
					path: 'charts/pie-donut',
					icon: 'PieChart',
				},
				chartsRadar: {
					id: 'chartsRadar',
					text: 'Radar',
					path: 'charts/radar',
					icon: 'BrightnessLow',
				},
				chartsPolar: {
					id: 'chartsPolar',
					text: 'Polar',
					path: 'charts/polar',
					icon: 'TrackChanges',
				},
				chartsRadialBar: {
					id: 'chartsRadialBar',
					text: 'Radial Bar',
					path: 'charts/radial-bar',
					icon: 'DonutLarge',
				},
				chartsBubble: {
					id: 'chartsBubble',
					text: 'Bubble',
					path: 'charts/bubble',
					icon: 'BubbleChart',
				},
				chartsScatter: {
					id: 'chartsScatter',
					text: 'Scatter',
					path: 'charts/scatter',
					icon: 'ScatterPlot',
				},
				chartsHeatMap: {
					id: 'chartsHeatMap',
					text: 'Heat Map',
					path: 'charts/heat-map',
					icon: 'GridOn',
				},
				chartsTreeMap: {
					id: 'chartsTreeMap',
					text: 'Tree Map',
					path: 'charts/tree-map',
					icon: 'AccountTree',
				},
			},
		},
		notification: {
			id: 'notification',
			text: 'Notification',
			path: 'notifications',
			icon: 'NotificationsNone',
		},
		hooks: {
			id: 'hooks',
			text: 'Hooks',
			path: 'hooks',
			icon: 'Anchor',
		},
	};
	const initialStatus = () => {
		setBackdropStatus(true);
		setBodyScrollStatus(false);
		setPlacement('end');
		setHeaderClose(true);
	};

	const GENERAL_USAGE = `const [state, setState] = useState(false);`;

	const GENERAL_USAGE_2 = `
<Button 
	onClick={ Function} // Example: () => setState(true)
	{...props}>
	...
</Button>

<OffCanvas
	tag={ String } // 'div' || 'section' || 'form'
	id={ String }
	titleId={ String }
	isBackdrop={ Boolean } 
	isBodyScroll={ Boolean } 
	placement={ String } // 'start || end || bottom'
	isOpen={ Boolean} // Example: state 
	setOpen={ Function } // Example: setState
	> 
	<OffCanvasHeader 
		className={ String }
		setOpen={ Function } // Example: setState
		>
		<OffCanvasTitle id={ String }>...</OffCanvasTitle>
	</OffCanvasHeader>
	<OffCanvasBody className={ String } {...props}>...</OffCanvasBody>
</OffCanvas>`;

	return (
		<PageWrapper title={componentPagesMenu.components.subMenu.offcanvas.text}>
			<SubHeader>
				<SubHeaderLeft>
					<Breadcrumb
						list={[
							{
								title: componentPagesMenu.components.text,
								to: `/${componentPagesMenu.components.path}`,
							},
							{
								title: componentPagesMenu.components.subMenu.offcanvas.text,
								to: `/${componentPagesMenu.components.subMenu.offcanvas.path}`,
							},
						]}
					/>
				</SubHeaderLeft>
				<SubHeaderRight>
					<CommonStoryBtn to='/docs/components-offcanvas--default' />
				</SubHeaderRight>
			</SubHeader>
			<Page>
				<div className='row'>
					<div className='col-12'>
						<Card stretch>
							<CardHeader>
								<CardLabel icon='Assignment'>
									<CardTitle>General Usage</CardTitle>
								</CardLabel>
							</CardHeader>
							<CardBody>
								<CardCodeView className='mb-4'>{GENERAL_USAGE}</CardCodeView>
								<CardCodeView>{GENERAL_USAGE_2}</CardCodeView>
							</CardBody>
						</Card>
					</div>

					{/* onClick */}
					<div className='col-lg-6'>
						<Card stretch>
							<CardHeader>
								<CardLabel icon='Fingerprint' iconColor='info'>
									<CardTitle>onClick</CardTitle>
									<CardSubTitle>event</CardSubTitle>
								</CardLabel>
								<CardActions>
									<CommonStoryBtn to='/story/components-offcanvas--default' />
								</CardActions>
							</CardHeader>
							<CardBody>
								<div className='row g-4 d-flex align-items-center'>
									<div className='col-auto'>
										<Button
											color='primary'
											isLight
											icon='Send'
											onClick={() => {
												initialStatus();
												setOffcanvasStatus(true);
											}}
											aria-controls='exampleOffcanvas'>
											Open offcanvas
										</Button>
									</div>
									<div className='col-auto'>
										<Icon
											icon='PersonAdd'
											className='mb-0 text-info h2'
											onClick={() => {
												initialStatus();
												setOffcanvasStatus(true);
											}}
											aria-controls='exampleOffcanvas'
										/>
									</div>
									<div className='col-auto'>
										<span
											onClick={() => {
												initialStatus();
												setOffcanvasStatus(true);
											}}
											role='presentation'
											aria-controls='exampleOffcanvas'>
											Open offcanvas
										</span>
									</div>
								</div>
							</CardBody>
							<CardFooter>
								<CommonDesc>
									You can use any event to make the state <code>true</code>.
								</CommonDesc>
							</CardFooter>
						</Card>
					</div>

					{/* isBackdrop */}
					<div className='col-lg-6'>
						<Card stretch>
							<CardHeader>
								<CardLabel icon='AutoFixHigh' iconColor='warning'>
									<CardTitle>isBackdrop</CardTitle>
									<CardSubTitle>OffCanvas</CardSubTitle>
								</CardLabel>
								<CardActions>
									<CommonStoryBtn to='/story/components-offcanvas--default&args=isBackdrop:false' />
								</CardActions>
							</CardHeader>
							<CardHeader>
								<CommonHowToUse>isBackdrop: PropTypes.bool,</CommonHowToUse>
							</CardHeader>
							<CardBody>
								<div className='row g-3'>
									<div className='col-auto'>
										<Button
											color='success'
											isLight
											icon='Send'
											onClick={() => {
												initialStatus();
												setOffcanvasStatus(true);
											}}
											aria-controls='exampleOffcanvas'>
											isBackdrop="true"
										</Button>
									</div>
									<div className='col-auto'>
										<Button
											color='danger'
											isLight
											icon='Send'
											onClick={() => {
												initialStatus();
												setBackdropStatus(false);
												setOffcanvasStatus(true);
											}}
											aria-controls='exampleOffcanvas'>
											isBackdrop="false"
										</Button>
									</div>
								</div>
							</CardBody>
							<CardFooter>
								<CommonDesc>
									The default value of isBackdrop is <code>"true"</code>. If you
									do not want it to put shadow on <code>body</code>, set its value
									to <code>"false"</code>.
								</CommonDesc>
							</CardFooter>
						</Card>
					</div>
					{/* isBodyScroll */}
					<div className='col-lg-6'>
						<Card stretch>
							<CardHeader>
								<CardLabel icon='Mouse' iconColor='secondary'>
									<CardTitle>isBodyScroll</CardTitle>
									<CardSubTitle>OffCanvas</CardSubTitle>
								</CardLabel>
								<CardActions>
									<CommonStoryBtn to='/story/components-offcanvas--default&args=isBodyScroll:true' />
								</CardActions>
							</CardHeader>
							<CardHeader>
								<CommonHowToUse>isBodyScroll: PropTypes.bool,</CommonHowToUse>
							</CardHeader>
							<CardBody>
								<div className='row g-3'>
									<div className='col-auto'>
										<Button
											color='success'
											isLight
											icon='Send'
											onClick={() => {
												initialStatus();
												setOffcanvasStatus(true);
											}}
											aria-controls='exampleOffcanvas'>
											isBodyScroll="false"
										</Button>
									</div>
									<div className='col-auto'>
										<Button
											color='danger'
											isLight
											icon='Send'
											onClick={() => {
												initialStatus();
												setBodyScrollStatus(true);
												setOffcanvasStatus(true);
											}}
											aria-controls='exampleOffcanvas'>
											isBodyScroll="true"
										</Button>
									</div>
									<div className='col-auto'>
										<Button
											color='warning'
											isLight
											icon='Send'
											onClick={() => {
												initialStatus();
												setBackdropStatus(false);
												setBodyScrollStatus(true);
												setOffcanvasStatus(true);
											}}
											aria-controls='exampleOffcanvas'>
											isBodyScroll="true" & isBackdrop="false"
										</Button>
									</div>
								</div>
							</CardBody>
							<CardFooter>
								<CommonDesc>You can enable scrolling except offcanvas.</CommonDesc>
							</CardFooter>
						</Card>
					</div>

					{/* placement */}
					<div className='col-lg-6'>
						<Card stretch>
							<CardHeader>
								<CardLabel icon='ControlCamera'>
									<CardTitle>placement</CardTitle>
									<CardSubTitle>OffCanvas</CardSubTitle>
								</CardLabel>
								<CardActions>
									<CommonStoryBtn to='/story/components-offcanvas--default&args=placement:start' />
								</CardActions>
							</CardHeader>
							<CardHeader>
								<CommonHowToUse>
									placement: PropTypes.oneOf(['start', 'top', 'end', 'bottom']),
								</CommonHowToUse>
							</CardHeader>
							<CardBody>
								<div className='row g-4'>
									<div className='col-auto'>
										<Button
											color='info'
											isLight
											icon='East'
											onClick={() => {
												initialStatus();
												setPlacement('start');
												setOffcanvasStatus(true);
											}}
											aria-controls='exampleOffcanvas'>
											placement="start"
										</Button>
									</div>
									<div className='col-auto'>
										<Button
											color='warning'
											isLight
											icon='South'
											onClick={() => {
												initialStatus();
												setPlacement('top');
												setOffcanvasStatus(true);
											}}
											aria-controls='exampleOffcanvas'>
											placement="top"
										</Button>
									</div>
									<div className='col-auto'>
										<Button
											color='success'
											isLight
											icon='North'
											onClick={() => {
												initialStatus();
												setPlacement('bottom');
												setOffcanvasStatus(true);
											}}
											aria-controls='exampleOffcanvas'>
											placement="bottom"
										</Button>
									</div>
									<div className='col-auto'>
										<Button
											color='secondary'
											isLight
											icon='West'
											onClick={() => {
												initialStatus();
												setPlacement('end');
												setOffcanvasStatus(true);
											}}
											aria-controls='exampleOffcanvas'>
											placement="end"
										</Button>
									</div>
								</div>
							</CardBody>
						</Card>
					</div>
					{/* setOpen */}
					<div className='col-lg-6'>
						<Card stretch>
							<CardHeader>
								<CardLabel icon='Close' iconColor='danger'>
									<CardTitle>setOpen</CardTitle>
									<CardSubTitle>OffCanvasHeader</CardSubTitle>
								</CardLabel>
							</CardHeader>
							<CardHeader>
								<CommonHowToUse>setOpen: PropTypes.func,</CommonHowToUse>
							</CardHeader>
							<CardBody>
								<div className='row g-4'>
									<div className='col-auto'>
										<Button
											color='success'
											isLight
											icon='Send'
											onClick={() => {
												initialStatus();
												setOffcanvasStatus(true);
											}}
											aria-controls='exampleOffcanvas'>
											isCloseButton="true"
										</Button>
									</div>
									<div className='col-auto'>
										<Button
											color='danger'
											isLight
											icon='Send'
											onClick={() => {
												initialStatus();
												setHeaderClose(false);
												setOffcanvasStatus(true);
											}}
											aria-controls='exampleOffcanvas'>
											isCloseButton="false"
										</Button>
									</div>
								</div>
							</CardBody>
						</Card>
					</div>

					<OffCanvas
						id='exampleOffcanvas'
						titleId='offcanvasExampleLabel'
						isOpen={offcanvasStatus}
						setOpen={setOffcanvasStatus}
						isBackdrop={backdropStatus}
						isBodyScroll={bodyScrollStatus}
						placement={placement}>
						<OffCanvasHeader setOpen={headerClose ? setOffcanvasStatus : undefined}>
							<OffCanvasTitle id='offcanvasExampleLabel'>
								Notifications
							</OffCanvasTitle>
						</OffCanvasHeader>
						<OffCanvasBody>
							<Alert icon='ViewInAr' isLight color='info' className='flex-nowrap'>
								4 new components added.
							</Alert>
							<Alert icon='ThumbUp' isLight color='warning' className='flex-nowrap'>
								New products added to stock.
							</Alert>
							<Alert icon='Inventory2' isLight color='danger' className='flex-nowrap'>
								There are products that need to be packaged.
							</Alert>
							<Alert
								icon='BakeryDining'
								isLight
								color='success'
								className='flex-nowrap'>
								Your food order is waiting for you at the consultation.
							</Alert>
							<Alert icon='Escalator' isLight color='primary' className='flex-nowrap'>
								Escalator will turn off at 6:00 pm.
							</Alert>
						</OffCanvasBody>
					</OffCanvas>
				</div>
			</Page>
		</PageWrapper>
	);
};

export default OffCanvasPage;
