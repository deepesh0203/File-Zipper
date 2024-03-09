/***********************************************************************
*   led_main.c									  
************************************************************************/
#include "lpc213x.h"

void delay (unsigned int k); 	

void main(void)
{
IODIR0 = 0xFFFFFFFF; //Configure Port0 as output Port
PINSEL0 = 0;   		//Configure Port0 as General Purose IO
while(1)
{
IOSET0 = 0x0000CC00;  //Set P0.15-P0.8 to '1' 
delay(1000);          //1 sec Delay
IOCLR0 = 0x0000FF00;  //Set P0.15-P0.8 to '0'
delay(1000);          //1 Sec Delay
}
}
//Delay Program
//Input - delay value in milli seconds
void delay(unsigned int k)  	
{
	unsigned int i,j;
	for (j=0; j<k; j++)
		for(i = 0; i<=800; i++);
	
}

/*-------------------------------------------------------*/