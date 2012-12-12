function CPU(type,mem)
{
	this.type = type;
	this.ax = 0;
	this.bx = 0;
	this.cx = 0;
	this.dx = 0;
	this.cs = 0xF000;
	this.ip = 0xFFF0;
	this.ss = 0;
	this.ds = 0;
	this.es = 0;
	this.flags = 2;
	this.memory = mem;
	this.exec = function()
	{
		this.op = this.memory[(this.cs<<4)+this.ip];
		document.getElementById('opcode').innerHTML += '<br />' + this.op;
		switch(this.op)
		{
			case 0x05:
			{
				var tmp = (this.memory[((this.cs<<4)+this.ip)+2]<<8)|this.memory[((this.cs<<4)+this.ip)+1];
				this.ax = (this.ax + tmp) & 0xFFFF;
				document.getElementById('opcode').innerHTML += '<br />ADD AX, ' + tmp;
				this.ip+=3;
				if(this.ax == 0) this.flags |= 0x0040;
				else this.flags &= 0xFFBF;
				var tmp = 0;
				for(var i = 0;i<16;i++)
				{
					if(this.ax & (1<<i)) tmp = (tmp + 1) & 1;
				}
				if(tmp&1) this.flags &= 0xFFFB;
				else this.flags |= 0x0004;
				break;
			}
			case 0x2D:
			{
				var tmp = (this.memory[((this.cs<<4)+this.ip)+2]<<8)|this.memory[((this.cs<<4)+this.ip)+1];
				this.ax = (this.ax - tmp) & 0xFFFF;
				document.getElementById('opcode').innerHTML += '<br />' + 'SUB AX, ' + tmp;
				this.ip+=3;
				if(this.ax == 0) this.flags |= 0x0040;
				else this.flags &= 0xFFBF;
				var tmp = 0;
				for(var i = 0;i<16;i++)
				{
					if(this.ax & (1<<i)) tmp = (tmp + 1) & 1;
				}
				if(tmp&1) this.flags &= 0xFFFB;
				else this.flags |= 0x0004;
				if(this.ax>=0x8000) this.flags |= 0x0080;
				else this.flags &= 0xFF7F;
				break;
			}
			case 0x33:
			{
				var modrm = this.memory[((this.cs<<4)+this.ip)+1];
				switch(modrm)
				{
					case 0xC0:
					{
						this.ax = 0; //XOR 0,0 gives 0, and XOR 1,1 gives 0, so XORing any value with itself gives 0.
						document.getElementById('opcode').innerHTML += '<br />' + 'XOR AX, AX';
						this.flags &= 0xFFBA;
						this.flags |= 0x0044;
						break;
					}
				}
				this.ip+=2;
				break;
			}
			case 0x40:
			{
				this.ax++;
				this.ax &= 0xFFFF;
				document.getElementById('opcode').innerHTML += '<br />' + 'INC AX';
				if(this.ax==0) this.flags |= 0x0040;
				else this.flags &= 0xFFBF;
				if(this.ax >= 0x8000) this.flags |= 0x0800;
				else this.flags &= 0xF7FF;
				this.ip++;
				break;
			}
			case 0x70:
			{
				document.getElementById('opcode').innerHTML += '<br />' + 'JO ' + this.memory[(this.cs<<4)+this.ip+1];
				var tmp = this.memory[(this.cs<<4)+this.ip+1];
				if(this.flags & 0x0800)
				{
					if(this.memory[(this.cs<<4)+this.ip+1] >= 0x80)
					{
						this.ip -= (~tmp + 1) & 0xFF;
					}
					else this.ip += tmp;
				}
				this.ip += 2;
				break;
			}
			case 0x71:
			{
				document.getElementById('opcode').innerHTML += '<br />' + 'JNO ' + this.memory[(this.cs<<4)+this.ip+1];
				var tmp = this.memory[(this.cs<<4)+this.ip+1];
				if((~this.flags) & 0x0800)
				{
					if(this.memory[(this.cs<<4)+this.ip+1] >= 0x80)
					{
						this.ip -= (~tmp + 1) & 0xFF;
					}
					else this.ip += tmp;
				}
				this.ip += 2;
				break;
			}
			case 0x72:
			{
				document.getElementById('opcode').innerHTML += '<br />' + 'JC ' + this.memory[(this.cs<<4)+this.ip+1];
				var tmp = this.memory[(this.cs<<4)+this.ip+1];
				if(this.flags & 0x0001)
				{
					if(this.memory[(this.cs<<4)+this.ip+1] >= 0x80)
					{
						this.ip -= (~tmp + 1) & 0xFF;
					}
					else this.ip += tmp;
				}
				this.ip += 2;
				break;
			}
			case 0x73:
			{
				document.getElementById('opcode').innerHTML += '<br />' + 'JNC ' + this.memory[(this.cs<<4)+this.ip+1];
				var tmp = this.memory[(this.cs<<4)+this.ip+1];
				if((~this.flags) & 0x0001)
				{
					if(this.memory[(this.cs<<4)+this.ip+1] >= 0x80)
					{
						this.ip -= (~tmp + 1) & 0xFF;
					}
					else this.ip += tmp;
				}
				this.ip += 2;
				break;
			}
			case 0x74:
			{
				document.getElementById('opcode').innerHTML += '<br />' + 'JZ ' + this.memory[(this.cs<<4)+this.ip+1];
				var tmp = this.memory[(this.cs<<4)+this.ip+1];
				if(this.flags & 0x0040)
				{
					if(this.memory[(this.cs<<4)+this.ip+1] >= 0x80)
					{
						this.ip -= (~tmp + 1) & 0xFF;
					}
					else this.ip += tmp;
				}
				this.ip += 2;
				break;
			}
			case 0x75:
			{
				document.getElementById('opcode').innerHTML += '<br />' + 'JNZ ' + this.memory[(this.cs<<4)+this.ip+1];
				var tmp = this.memory[(this.cs<<4)+this.ip+1];
				if((~this.flags) & 0x0040)
				{
					if(this.memory[(this.cs<<4)+this.ip+1] >= 0x80)
					{
						this.ip -= (~tmp + 1) & 0xFF;
					}
					else this.ip += tmp;
				}
				this.ip += 2;
				break;
			}
			case 0x78:
			{
				document.getElementById('opcode').innerHTML += '<br />' + 'JS ' + this.memory[(this.cs<<4)+this.ip+1];
				var tmp = this.memory[(this.cs<<4)+this.ip+1];
				if(this.flags & 0x0080)
				{
					if(this.memory[(this.cs<<4)+this.ip+1] >= 0x80)
					{
						this.ip -= (~tmp + 1) & 0xFF;
					}
					else this.ip += tmp;
				}
				this.ip += 2;
				break;
			}
			case 0x7A:
			{
				document.getElementById('opcode').innerHTML += '<br />' + 'JP ' + this.memory[(this.cs<<4)+this.ip+1];
				var tmp = this.memory[(this.cs<<4)+this.ip+1];
				if(this.flags & 0x0004)
				{
					if(this.memory[(this.cs<<4)+this.ip+1] >= 0x80)
					{
						this.ip -= (~tmp + 1) & 0xFF;
					}
					else this.ip += tmp;
				}
				this.ip += 2;
				break;
			}
			case 0x7B:
			{
				document.getElementById('opcode').innerHTML += '<br />' + 'JNP ' + this.memory[(this.cs<<4)+this.ip+1];
				var tmp = this.memory[(this.cs<<4)+this.ip+1];
				if(~(this.flags & 0x0004) & 0x0004)
				{
					if(tmp & 0x80)
					{
						this.ip -= (~tmp + 1) & 0xFF;
					}
					else this.ip += tmp;
				}
				this.ip += 2;
				break;
			}
			case 0x8E:
			{
				var modrm = this.memory[((this.cs<<4)+this.ip)+1];
				switch(modrm)
				{
					case 0xD8:
					{
						document.getElementById('opcode').innerHTML += '<br />' + 'MOV DS, AX';
						this.ds = this.ax;
						break;
					}
				}
				this.ip+=2;
				break;
			}
			case 0xB8:
			{
				this.ax = (this.memory[((this.cs<<4)+this.ip)+2]<<8)|this.memory[((this.cs<<4)+this.ip)+1];
				document.getElementById('opcode').innerHTML += '<br />' + 'MOV AX, ' + this.ax;
				this.ip+=3;
				break;
			}
			case 0xBB:
			{
				this.bx = (this.memory[((this.cs<<4)+this.ip)+2]<<8)|this.memory[((this.cs<<4)+this.ip)+1];
				document.getElementById('opcode').innerHTML += '<br />' + 'MOV BX, ' + this.bx;
				this.ip+=3;
				break;
			}
			case 0xC7:
			{
				var modrm = this.memory[((this.cs<<4)+this.ip)+1];
				switch(modrm)
				{
					case 0x06:
					{
						this.memory[(this.ds<<4)+((this.memory[(this.cs<<4)+this.ip+3]<<8)|this.memory[(this.cs<<4)+this.ip+2])] = (this.memory[((this.cs<<4)+this.ip)+5]<<8)|this.memory[((this.cs<<4)+this.ip)+4];
						document.getElementById('opcode').innerHTML += '<br />' + 'MOV WORD PTR DS:' + ((this.memory[(this.cs<<4)+this.ip+3]<<8)|this.memory[(this.cs<<4)+this.ip+2]) + ', ' + (this.memory[((this.cs<<4)+this.ip)+5]<<8)|this.memory[((this.cs<<4)+this.ip)+4];
						this.ip+=2;
						break;
					}
				}
				this.ip+=4;
				break;
			}
			case 0xD1:
			{
				var modrm = this.memory[((this.cs<<4)+this.ip)+1];
				switch(modrm)
				{
					case 0xE0:
					{
						if(this.ax >= 0x8000) this.flags |= 0x0001;
						else this.flags &= 0xFFFE;
						this.ax = (this.ax << 1) & 0xFFFF;
						document.getElementById('opcode').innerHTML += '<br />' + 'SHL AX, 1';
						if(this.ax == 0) this.flags |= 0x0040;
						else this.flags &= 0xFFBF;
						break;
					}
				}
				this.ip+=2;
				break;
			}
			case 0xEA:
			{
				var tmp = this.ip;
				this.ip = (this.memory[((this.cs<<4)+this.ip)+2]<<8)|this.memory[((this.cs<<4)+this.ip)+1];
				this.cs = (this.memory[((this.cs<<4)+tmp)+4]<<8)|this.memory[((this.cs<<4)+tmp)+3];
				document.getElementById('opcode').innerHTML += '<br />' + 'JMP ' + this.cs + ':' + this.ip;
				break;
			}
			case 0xFA:
			{
				this.flags &= 0xFDFF;
				document.getElementById('opcode').innerHTML += '<br />' + 'CLI';
				this.ip++;
				break;
			}
			default:
			{
			}
		}
		this.dumpregs = function()
		{
			document.getElementById('opcode').innerHTML += '<br />' + this.ip;
		}
		this.dumpregs();
	};
}